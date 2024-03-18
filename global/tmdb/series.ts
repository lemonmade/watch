import type {Prisma, PrismaClient, SeasonStatus} from '@prisma/client';

import {EpisodeSelection} from '../../packages/api/source/index.ts';

import {tmdbFetch as baseTmdbFetch} from './fetch.ts';
import {seriesToHandle} from './handle.ts';
import type {TmdbEpisode, TmdbSeries, TmdbSeason} from './types.ts';

export function seasonStatus(
  season: TmdbSeason,
  series: TmdbSeries,
): SeasonStatus {
  if (season.episodes == null) {
    return 'CONTINUING';
  }

  const lastEpisode = season.episodes
    .reverse()
    .find((episode) => episode.air_date != null);

  if (lastEpisode == null) {
    return 'CONTINUING';
  }

  if (!isOlderThan(lastEpisode, Date.now())) {
    return 'CONTINUING';
  }

  if (series.last_episode_to_air) {
    if (series.last_episode_to_air.season_number > season.season_number) {
      return 'ENDED';
    }

    if (series.last_episode_to_air.season_number < season.season_number) {
      return 'CONTINUING';
    }

    if (
      (series.next_episode_to_air == null ||
        series.next_episode_to_air.season_number !== season.season_number) &&
      // last episode older than 60 days
      isOlderThan(lastEpisode, Date.now() - 60 * 24 * 60 * 60 * 1000)
    ) {
      return 'ENDED';
    }
  }

  return 'CONTINUING';
}

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

  log(`Updating series (tmdb: ${tmdbId}, id: ${seriesId})`);

  const series = await prisma.series.findUniqueOrThrow({
    where: {id: seriesId},
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
  const seasonsToDelete = new Set<number>();

  const seriesResult: TmdbSeries = await tmdbFetch(`/tv/${tmdbId}`);

  for (const season of seasonsToUpdate) {
    if (season > seriesResult.number_of_seasons) {
      log(`Deleting season ${season} (no longer exists)`);
      seasonsToDelete.add(season);
      seasonsToUpdate.delete(season);
    }
  }

  if (seasonsToUpdate.size > 0) {
    log(
      `Updating continuing season${
        continuingSeasons.length === 1 ? '' : 's'
      }: ${[...continuingSeasons].join(', ')}`,
    );
  } else {
    log(`No continuing seasons to update`);
  }

  for (let i = 1; i <= seriesResult.number_of_seasons; i++) {
    if (!seasonNumbers.has(i)) {
      log(`Creating missing season: ${i}`);
      seasonsToUpdate.add(i);
    }
  }

  const seasonResults: TmdbSeason[] = await Promise.all(
    [...seasonsToUpdate].map((season) =>
      tmdbFetch(`/tv/${tmdbId}/season/${season}`),
    ),
  );

  const results: string[] = [];

  const updateSeasons: Prisma.SeasonUpdateArgs[] = [];
  const createSeasons: Prisma.SeasonCreateWithoutSeriesInput[] = [];
  const updateWatchThroughs: Prisma.WatchThroughUpdateArgs[] = [];
  const createWatches: Prisma.WatchCreateManyInput[] = [];

  for (const season of seasonResults) {
    if (season.season_number == null) continue;

    log(`Updating season ${season.season_number}`);
    console.log(season);

    const id = seasonToId.get(season.season_number);

    const status = seasonStatus(season, seriesResult);

    if (id) {
      if (status === 'ENDED') {
        const watchThroughsToUpdate = await prisma.watchThrough.findMany({
          where: {
            seriesId,
            status: 'ONGOING',
            nextEpisode: EpisodeSelection.stringify({
              season: season.season_number,
              episode: (season.episodes?.length ?? 0) + 1,
            }),
          },
        });

        for (const watchThrough of watchThroughsToUpdate) {
          const nextEpisode = EpisodeSelection.from(
            ...(watchThrough.includeEpisodes as any[]),
          ).nextEpisode(watchThrough.nextEpisode as any);

          if (nextEpisode == null) {
            createWatches.push({
              seasonId: id,
              userId: watchThrough.userId,
              finishedAt: watchThrough.updatedAt,
              watchThroughId: watchThrough.id,
            });
          }

          updateWatchThroughs.push({
            where: {id: watchThrough.id},
            data: nextEpisode
              ? {
                  nextEpisode: EpisodeSelection.stringify(nextEpisode),
                }
              : {
                  status: 'FINISHED',
                  nextEpisode: null,
                  finishedAt: watchThrough.updatedAt,
                },
          });
        }
      }

      updateSeasons.push({
        where: {id},
        data: {
          ...tmdbSeasonToSeasonInput(season, seriesResult),
          episodes: {
            upsert: season.episodes?.map((episode) => {
              const episodeInput: Prisma.EpisodeUncheckedCreateWithoutSeasonInput =
                {
                  number: episode.episode_number,
                  title: episode.name,
                  firstAired: tmdbAirDateToDate(episode.air_date),
                  overview: episode.overview?.slice(0, 900) || null,
                  stillUrl: episode.still_path
                    ? `https://image.tmdb.org/t/p/original${episode.still_path}`
                    : null,
                  seasonNumber: season.season_number,
                  seriesId,
                };

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
        handle: seriesToHandle(seriesResult),
        firstAired: tmdbAirDateToDate(seriesResult.first_air_date),
        status: tmdbStatusToEnum(seriesResult.status),
        overview: seriesResult.overview?.slice(0, 900) || null,
        posterUrl: seriesResult.poster_path
          ? `https://image.tmdb.org/t/p/original${seriesResult.poster_path}`
          : null,
        seasonCount: seriesResult.number_of_seasons,
        seasons: {
          create: createSeasons,
        },
      },
    }),
    ...updateSeasons.map((update) => prisma.season.update(update)),
    ...(seasonsToDelete.size > 0
      ? [
          prisma.season.deleteMany({
            where: {
              id: {
                in: [...seasonsToDelete].map(
                  (season) => seasonToId.get(season)!,
                ),
              },
            },
          }),
        ]
      : []),
    ...(createWatches.length > 0
      ? [
          prisma.watch.createMany({
            data: createWatches,
          }),
        ]
      : []),
    ...updateWatchThroughs.map((update) => prisma.watchThrough.update(update)),
  ]);

  results.push(JSON.stringify(updateSeries, null, 2));

  return {series: updateSeries, results};
}

function isOlderThan(episode: Pick<TmdbEpisode, 'air_date'>, time: number) {
  if (episode?.air_date == null) return false;

  const airDate = new Date(episode.air_date);
  return airDate.getTime() < time;
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
): Prisma.SeasonCreateWithoutSeriesInput {
  return {
    number: season.season_number,
    firstAired: tmdbAirDateToDate(season.air_date),
    overview: season.overview?.slice(0, 900) ?? null,
    status: seasonStatus(season, series),
    posterUrl: season.poster_path
      ? `https://image.tmdb.org/t/p/original${season.poster_path}`
      : null,
    episodeCount: season.episodes?.length ?? 0,
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
