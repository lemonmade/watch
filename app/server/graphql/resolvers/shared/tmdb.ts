import Env from '@quilted/quilt/env';

import {
  seasonStatus,
  seriesToHandle,
  type TmdbSeries,
  type TmdbSeason,
  type TmdbExternalIds,
} from '~/global/tmdb.ts';

import type {Context} from '../../context.ts';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    TMDB_ACCESS_TOKEN: string;
  }
}

const SEASON_BATCH_SIZE = 10;

export async function tmdbFetch<T = unknown>(path: string): Promise<T> {
  const fetched = await fetch(`https://api.themoviedb.org/3${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${Env.TMDB_ACCESS_TOKEN}`,
    },
  });

  return fetched.json();
}

export async function loadTmdbSeries(
  tmdbId: string,
  {prisma}: Pick<Context, 'prisma'>,
) {
  const {external_ids: seriesIds, ...seriesResult} = await tmdbFetch<
    TmdbSeries & {external_ids: TmdbExternalIds}
  >(`/tv/${tmdbId}?append_to_response=external_ids`);

  const seasonResults = (
    await Promise.all(
      seriesResult.seasons.map((season) =>
        tmdbFetch<TmdbSeason>(`/tv/${tmdbId}/season/${season.season_number}`),
      ),
    )
  ).filter(({season_number: seasonNumber}) => seasonNumber != null);

  try {
    const series = await prisma.series.create({
      data: {
        tmdbId: String(tmdbId),
        imdbId: seriesIds.imdb_id,
        name: seriesResult.name,
        handle: seriesToHandle(seriesResult),
        firstAired: tmdbAirDateToDate(seriesResult.first_air_date),
        status: tmdbStatusToEnum(seriesResult.status),
        overview: seriesResult.overview || null,
        posterUrl: seriesResult.poster_path
          ? `https://image.tmdb.org/t/p/original${seriesResult.poster_path}`
          : null,
        seasonCount: seasonResults.length,
        seasons: {
          create: seasonResults
            .slice(0, SEASON_BATCH_SIZE)
            .map(
              (
                season,
              ): import('@prisma/client').Prisma.SeasonCreateWithoutSeriesInput => ({
                number: season.season_number,
                firstAired: tmdbAirDateToDate(season.air_date),
                overview: season.overview ?? null,
                status: seasonStatus(season, seriesResult),
                posterUrl: season.poster_path
                  ? `https://image.tmdb.org/t/p/original${season.poster_path}`
                  : null,
                episodeCount: season.episodes?.length ?? 0,
                episodes: {
                  create: season.episodes?.map(
                    (
                      episode,
                    ): import('@prisma/client').Prisma.EpisodeCreateWithoutSeasonInput => ({
                      number: episode.episode_number,
                      title: episode.name,
                      firstAired: tmdbAirDateToDate(episode.air_date),
                      overview: episode.overview || null,
                      stillUrl: episode.still_path
                        ? `https://image.tmdb.org/t/p/original${episode.still_path}`
                        : null,
                    }),
                  ),
                },
              }),
            ),
        },
      },
    });

    if (seasonResults.length > SEASON_BATCH_SIZE) {
      for (const season of seasonResults.slice(SEASON_BATCH_SIZE)) {
        await prisma.season.create({
          data: {
            seriesId: series.id,
            number: season.season_number,
            firstAired: tmdbAirDateToDate(season.air_date),
            overview: season.overview ?? null,
            status:
              season.season_number === seriesResult.number_of_seasons &&
              tmdbStatusToEnum(seriesResult.status) === 'RETURNING'
                ? 'CONTINUING'
                : 'ENDED',
            posterUrl: season.poster_path
              ? `https://image.tmdb.org/t/p/original${season.poster_path}`
              : null,
            episodeCount: season.episodes?.length ?? 0,
            episodes: {
              create: season.episodes?.map(
                (
                  episode,
                ): import('@prisma/client').Prisma.EpisodeCreateWithoutSeasonInput => ({
                  number: episode.episode_number,
                  title: episode.name,
                  firstAired: tmdbAirDateToDate(episode.air_date),
                  overview: episode.overview || null,
                  stillUrl: episode.still_path
                    ? `https://image.tmdb.org/t/p/original${episode.still_path}`
                    : null,
                }),
              ),
            },
          },
        });
      }
    }

    return series;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    // eslint-disable-next-line no-console
    console.log({seriesResult, seriesIds});
    throw error;
  }
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

function tmdbStatusToEnum(status: TmdbSeries['status']) {
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
