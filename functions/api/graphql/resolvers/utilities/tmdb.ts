import Env from '@quilted/quilt/env';
import type {Context} from '../../context';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    TMDB_ACCESS_TOKEN: string;
  }
}

export async function tmdbFetch<T = unknown>(path: string): Promise<T> {
  const fetched = await fetch(`https://api.themoviedb.org/3${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${Env.TMDB_ACCESS_TOKEN}`,
    },
  });

  return fetched.json();
}

/* eslint-disable @typescript-eslint/naming-convention */
interface TmdbSeries {
  name: string;
  status: string;
  seasons: TmdbSeriesSeason[];
  air_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string;
  number_of_seasons?: number;
}

interface TmdbExternalIds {
  imdb_id: string;
}

interface TmdbSeriesSeason {
  season_number: number;
}

interface TmdbSeason {
  season_number: number;
  episodes: TmdbEpisode[];
  air_date?: string;
  overview?: string;
  poster_path?: string;
}

interface TmdbEpisode {
  name: string;
  overview?: string;
  air_date?: string;
  episode_number: number;
  season_number: number;
  still_path?: string;
}
/* eslint-enable @typescript-eslint/naming-convention */

export async function loadTmdbSeries(
  tmdbId: string,
  {prisma}: Pick<Context, 'prisma'>,
) {
  const [seriesResult, seriesIds] = await Promise.all([
    tmdbFetch<TmdbSeries>(`/tv/${tmdbId}`),
    tmdbFetch<TmdbExternalIds>(`/tv/${tmdbId}/external_ids`),
  ] as const);

  const seasonResults = (
    await Promise.all(
      seriesResult.seasons.map((season) =>
        tmdbFetch<TmdbSeason>(`/tv/${tmdbId}/season/${season.season_number}`),
      ),
    )
  ).filter(({season_number: seasonNumber}) => seasonNumber != null);

  const series = await prisma.series.create({
    data: {
      tmdbId: String(tmdbId),
      imdbId: seriesIds.imdb_id,
      name: seriesResult.name,
      handle: seriesResult.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-$/, '')
        .replace(/^-/, ''),
      firstAired: tmdbAirDateToDate(seriesResult.first_air_date),
      status: tmdbStatusToEnum(seriesResult.status),
      overview: seriesResult.overview || null,
      posterUrl: seriesResult.poster_path
        ? `https://image.tmdb.org/t/p/original${seriesResult.poster_path}`
        : null,
      seasonCount: seasonResults.length,
      seasons: {
        create: seasonResults.map(
          (
            season,
          ): import('@prisma/client').Prisma.SeasonCreateWithoutSeriesInput => ({
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
            episodeCount: season.episodes.length,
            episodes: {
              create: season.episodes.map(
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

  return series;
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
