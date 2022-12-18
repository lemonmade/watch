/* eslint no-console: off */

import type {PrismaClient} from '@prisma/client';

import {tmdbFetch as baseTmdbFetch} from './fetch';
import type {TmdbEpisode, TmdbSeries, TmdbSeason} from './types';

export async function updateSeries({
  id: seriesId,
  tmdbId,
  name,
  prisma,
  accessToken,
}: {
  id: string;
  tmdbId: string;
  name: string;
  prisma: PrismaClient;
  accessToken?: string;
}) {
  const log = (message: string) => console.log(`[${name}] ${message}`);
  const tmdbFetch = (path: string) => baseTmdbFetch(path, {accessToken});

  log(`Updating series`);

  const series = await prisma.series.findFirst({
    where: {id: seriesId},
    rejectOnNotFound: true,
  });

  const seasons = await prisma.season.findMany({
    where: {seriesId},
    select: {
      id: true,
      number: true,
      status: true,
      episodes: {select: {id: true, number: true}},
    },
  });

  const seasonToId = new Map(seasons.map(({id, number}) => [number, id]));
  const seasonNumbers = new Set(seasons.map((season) => season.number));
  const continuingSeasons = seasons
    .filter((season) => season.status === 'CONTINUING')
    .map((season) => season.number);
  const seasonsToUpdate = new Set(continuingSeasons);

  log(`Updating continuing seasons: ${[...continuingSeasons].join(', ')}`);
  const seriesResult: TmdbSeries = await tmdbFetch(`/tv/${tmdbId}`);
  log(JSON.stringify(seriesResult, null, 2));

  for (let i = 1; i <= seriesResult.number_of_seasons; i++) {
    if (!seasonNumbers.has(i)) {
      log(`Updating missing season: ${i}`);
      seasonsToUpdate.add(i);
    }
  }

  const seasonResults: TmdbSeason[] = await Promise.all(
    [...seasonsToUpdate].map((season) =>
      tmdbFetch(`/tv/${tmdbId}/season/${season}`),
    ),
  );

  const results: string[] = [];

  console.log('SEASONS TO UPDATE:');
  console.log(
    [...seasonsToUpdate],
    [...seasonNumbers],
    seriesResult.number_of_seasons,
  );

  const updateSeasons: import('@prisma/client').Prisma.SeasonUpdateArgs[] = [];
  const createSeasons: import('@prisma/client').Prisma.SeasonCreateWithoutSeriesInput[] =
    [];
  const completedWatchthroughs: import('@prisma/client/edge').Prisma.WatchThroughWhereInput[] =
    [];

  const lastSeasonWithAirDate = seasonResults
    .reverse()
    .find((season) => season.air_date != null);

  for (const season of seasonResults) {
    console.log('UPDATING SEASON:');
    console.log(season);

    if (season.season_number == null) continue;

    const id = seasonToId.get(season.season_number);
    const isEnded =
      season.season_number === lastSeasonWithAirDate?.season_number &&
      (tmdbStatusToEnum(seriesResult.status) !== 'RETURNING' ||
        (seriesResult.next_episode_to_air == null &&
          isOlderThanThirtyDays(seriesResult.last_episode_to_air)));

    if (id) {
      if (isEnded) {
        completedWatchthroughs.push({
          current: bufferFromSlice({
            season: season.season_number,
            episode: (season.episodes?.length ?? 0) + 1,
          }),
          to: bufferFromSlice({season: season.season_number}),
        });
      }

      updateSeasons.push({
        where: {id},
        data: {
          ...tmdbSeasonToSeasonInput(season, seriesResult),
          episodes: {
            upsert: season.episodes?.map((episode) => {
              const episodeInput = tmdbEpisodeToCreateInput(episode);

              return {
                where: {
                  seasonId_number: {
                    seasonId: id,
                    number: episode.episode_number,
                  },
                },
                create: episodeInput,
                update: episodeInput,
              };
            }),
          },
        },
      });

      results.push(
        `**${name}** (updated existing season)\nhttps://watch.lemon.tools/app/series/${series.handle}\nSeason ${season.season_number} => \`${id}\``,
      );
    } else {
      createSeasons.push({
        ...tmdbSeasonToSeasonInput(season, seriesResult),
      });

      results.push(
        `**${name}** (add new season)\nhttps://watch.lemon.tools/app/series/${series.handle}\nSeason ${season.season_number}`,
      );
    }
  }

  const [updateSeries] = await prisma.$transaction([
    prisma.series.update({
      where: {id: seriesId},
      include: {
        seasons: {
          include: {episodes: true},
        },
      },
      data: {
        name: seriesResult.name,
        firstAired: tmdbAirDateToDate(seriesResult.first_air_date),
        status: tmdbStatusToEnum(seriesResult.status),
        overview: seriesResult.overview?.slice(0, 900) || null,
        posterUrl: seriesResult.poster_path
          ? `https://image.tmdb.org/t/p/original${seriesResult.poster_path}`
          : null,
        seasons: {
          create: createSeasons,
        },
      },
    }),
    ...updateSeasons.map((update) => prisma.season.update(update)),
    ...(completedWatchthroughs.length > 0
      ? [
          prisma.watchThrough.updateMany({
            data: {current: null, status: 'FINISHED'},
            where: {
              seriesId,
              status: 'ONGOING',
              OR: completedWatchthroughs,
            },
          }),
        ]
      : []),
  ]);

  results.push(JSON.stringify(updateSeries, null, 2));

  return {series: updateSeries, results};
}

function isOlderThanThirtyDays(episode?: {air_date?: string}) {
  if (episode?.air_date == null) return false;

  const airDate = new Date(episode.air_date);
  return Date.now() - airDate.getTime() >= 30 * 24 * 60 * 60 * 1000;
}

function tmdbAirDateToDate(date?: string) {
  if (!date) {
    return null;
  }

  const match = /(?<year>[0-9]{4})-(?<month>[0-9]{2})-(?<day>[0-9]{2})/.exec(
    date,
  );

  if (match == null) {
    return null;
  }

  const {year, month, day} = match.groups!;
  return new Date(
    parseInt(year!, 10),
    parseInt(month!, 10) - 1,
    parseInt(day!, 10),
  );
}

function tmdbSeasonToSeasonInput(
  season: TmdbSeason,
  series: TmdbSeries,
): import('@prisma/client').Prisma.SeasonCreateWithoutSeriesInput {
  const isEnded =
    season.season_number === series.number_of_seasons &&
    (tmdbStatusToEnum(series.status) !== 'RETURNING' ||
      (series.next_episode_to_air == null &&
        series.last_episode_to_air != null &&
        isOlderThanThirtyDays(series.last_episode_to_air)));

  return {
    number: season.season_number,
    firstAired: tmdbAirDateToDate(season.air_date),
    overview: season.overview?.slice(0, 900) ?? null,
    status: isEnded ? 'ENDED' : 'CONTINUING',
    posterUrl: season.poster_path
      ? `https://image.tmdb.org/t/p/original${season.poster_path}`
      : null,
    episodeCount: season.episodes?.length ?? 0,
  };
}

function tmdbEpisodeToCreateInput(
  episode: TmdbEpisode,
): import('@prisma/client').Prisma.EpisodeCreateWithoutSeasonInput {
  return {
    number: episode.episode_number,
    title: episode.name,
    firstAired: tmdbAirDateToDate(episode.air_date),
    overview: episode.overview?.slice(0, 900) || null,
    stillUrl: episode.still_path
      ? `https://image.tmdb.org/t/p/original${episode.still_path}`
      : null,
  };
}

function tmdbStatusToEnum(status: string) {
  switch (status) {
    case 'Returning Series':
      return 'RETURNING';
    case 'Ended':
      return 'ENDED';
    case 'Canceled':
      return 'CANCELLED';
    default: {
      throw new Error(`Unrecognized status: ${status}`);
    }
  }
}

interface Slice {
  season: number;
  episode?: number;
}

function bufferFromSlice(slice: Slice) {
  return slice.episode == null
    ? Buffer.from([slice.season])
    : Buffer.from([slice.season, slice.episode]);
}
