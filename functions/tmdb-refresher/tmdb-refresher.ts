/* eslint no-console: off */

import type {SQSHandler} from 'aws-lambda';
import Env from '@quilted/quilt/env';

import {createPrisma} from 'shared/utilities/database';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    TMDB_ACCESS_TOKEN: string;
  }
}

/* eslint-disable @typescript-eslint/naming-convention */
interface TmdbSeries {
  name: string;
  overview?: string;
  status: string;
  poster_path?: string;
  number_of_seasons: number;
  first_air_date?: string;
  next_episode_to_air?: TmdbEpisode;
  last_episode_to_air?: TmdbEpisode;
}

interface TmdbEpisode {
  episode_number: number;
  name: string;
  air_date?: string;
  overview: string;
  still_path?: string;
}

interface TmdbSeason {
  season_number: number;
  air_date: string;
  overview: string;
  poster_path?: string;
  episodes: TmdbEpisode[];
}
/* eslint-enable @typescript-eslint/naming-convention */

const prismaPromise = createPrisma();

export const handler: SQSHandler = async (event) => {
  console.log(JSON.stringify(event, null, 2));

  try {
    await Promise.all(
      event.Records.map(async (record) => {
        const {messageAttributes} = record;

        const id = messageAttributes.id!.stringValue;
        const name = messageAttributes.name!.stringValue;
        const tmdbId = messageAttributes.tmdbId!.stringValue;

        const result = await updateSeries({
          id: id!,
          name: name!,
          tmdbId: tmdbId!,
        });

        await fetch(
          'https://discordapp.com/api/webhooks/656640833063223325/1ofugrkDFpqaSAWvD6mLlg5EN3UDOfBdib4WKNE17Q5YxUoz8wpwuLoKCeaZJqCHyfeC',
          {
            method: 'POST',
            body: JSON.stringify({
              content: result ?? `Updated series: **${name}**`,
            }),
            headers: {'Content-Type': 'application/json'},
          },
        );
      }),
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
};

async function updateSeries({
  id: seriesId,
  tmdbId,
  name,
}: {
  id: string;
  tmdbId: string;
  name: string;
}) {
  const log = (message: string) => console.log(`[${name}] ${message}`);

  log(`Updating series`);

  const prisma = await prismaPromise;

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

  console.log(seasonsToUpdate, seasonNumbers, seriesResult.number_of_seasons);

  const updateSeasons: import('@prisma/client').Prisma.SeasonUpdateArgs[] = [];
  const createSeasons: import('@prisma/client').Prisma.SeasonCreateWithoutSeriesInput[] =
    [];
  const completedWatchthroughs: import('@prisma/client').Prisma.WatchThroughWhereInput[] =
    [];

  for (const season of seasonResults) {
    const id = seasonToId.get(season.season_number);
    const isEnded =
      season.season_number === seriesResult.number_of_seasons &&
      (tmdbStatusToEnum(seriesResult.status) !== 'RETURNING' ||
        (seriesResult.next_episode_to_air == null &&
          isOlderThanThirtyDays(seriesResult.last_episode_to_air)));

    if (id) {
      if (isEnded) {
        completedWatchthroughs.push({
          current: bufferFromSlice({
            season: season.season_number,
            episode: season.episodes.length + 1,
          }),
          to: bufferFromSlice({season: season.season_number}),
        });
      }

      updateSeasons.push({
        where: {id},
        data: {
          ...tmdbSeasonToSeasonInput(season, seriesResult),
          episodes: {
            upsert: season.episodes.map((episode) => {
              const episodeInput = tmdbEpisodeToCreateInput(episode);

              return {
                where: {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
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
        `**${name}** (updated existing season)\nhttps://watch.lemon.tools/app/series/${seriesId}\nSeason ${season.season_number} => \`${id}\``,
      );
    } else {
      createSeasons.push({
        ...tmdbSeasonToSeasonInput(season, seriesResult),
      });

      results.push(
        `**${name}** (add new season)\nhttps://watch.lemon.tools/app/series/${seriesId}\nSeason ${season.season_number}`,
      );
    }
  }

  const [series] = await prisma.$transaction([
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
        overview: seriesResult.overview || null,
        posterUrl: seriesResult.poster_path
          ? `https://image.tmdb.org/t/p/original${seriesResult.poster_path}`
          : null,
        seasons: {
          create: createSeasons,
        },
        // seasons: {
        //   upsert: [

        //   ]
        // }
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

  results.push(JSON.stringify(series, null, 2));

  console.log(results.join('\n\n'));
  return results.join('\n\n');
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function isOlderThanThirtyDays(episode?: {air_date?: string}) {
  if (episode?.air_date == null) return false;

  const airDate = new Date(episode.air_date);
  return Date.now() - airDate.getTime() >= 30 * 24 * 60 * 60 * 1000;
}

async function tmdbFetch(path: string) {
  const fetched = await fetch(`https://api.themoviedb.org/3${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${Env.TMDB_ACCESS_TOKEN}`,
    },
  });

  return fetched.json();
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
    overview: season.overview ?? null,
    status: isEnded ? 'ENDED' : 'CONTINUING',
    posterUrl: season.poster_path
      ? `https://image.tmdb.org/t/p/original${season.poster_path}`
      : null,
    episodeCount: season.episodes.length,
  };
}

function tmdbEpisodeToCreateInput(
  episode: TmdbEpisode,
): import('@prisma/client').Prisma.EpisodeCreateWithoutSeasonInput {
  return {
    number: episode.episode_number,
    title: episode.name,
    firstAired: tmdbAirDateToDate(episode.air_date),
    overview: episode.overview || null,
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
