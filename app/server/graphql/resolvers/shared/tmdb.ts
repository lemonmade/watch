import {
  tmdbFetch,
  seasonStatus,
  seriesToHandle,
  tmdbStatusToEnum,
  type TmdbSeries,
  type TmdbSeason,
  type TmdbExternalIds,
} from '~/global/tmdb.ts';

import type {Context} from '../../context.ts';

const SEASON_BATCH_SIZE = 10;

export async function loadTmdbSeries(
  tmdbId: string,
  {prisma, env}: Pick<Context, 'prisma' | 'env'>,
) {
  const {external_ids: seriesIds, ...seriesResult} = await tmdbFetch<
    TmdbSeries & {external_ids: TmdbExternalIds}
  >(`/tv/${tmdbId}?append_to_response=external_ids`, {
    accessToken: env.TMDB_ACCESS_TOKEN,
  });

  const seasonResults = (
    await Promise.all(
      seriesResult.seasons.map((season) =>
        tmdbFetch<TmdbSeason>(`/tv/${tmdbId}/season/${season.season_number}`, {
          accessToken: env.TMDB_ACCESS_TOKEN,
        }),
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
      },
    });

    let currentIndex = 0;
    let currentBatch = seasonResults.slice(currentIndex, SEASON_BATCH_SIZE);

    while (currentBatch.length > 0) {
      await Promise.all(
        currentBatch.map(async (season) => {
          await prisma.season.create({
            data: {
              seriesId: series.id,
              number: season.season_number,
              firstAired: tmdbAirDateToDate(season.air_date),
              overview: season.overview ?? null,
              status: seasonStatus(season, seriesResult),
              posterUrl: season.poster_path
                ? `https://image.tmdb.org/t/p/original${season.poster_path}`
                : null,
              episodeCount: season.episodes?.length ?? 0,
              episodes: {
                create: season.episodes?.map((episode) => ({
                  seriesId: series.id,
                  number: episode.episode_number,
                  seasonNumber: season.season_number,
                  title: episode.name,
                  firstAired: tmdbAirDateToDate(episode.air_date),
                  overview: episode.overview || null,
                  stillUrl: episode.still_path
                    ? `https://image.tmdb.org/t/p/original${episode.still_path}`
                    : null,
                })),
              },
            },
          });
        }),
      );

      currentIndex += currentBatch.length;
      currentBatch = seasonResults.slice(
        currentIndex,
        currentIndex + SEASON_BATCH_SIZE,
      );
    }

    return series;
  } catch (error) {
    console.log(error);
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
