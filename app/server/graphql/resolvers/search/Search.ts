import {tmdbFetch} from '~/global/tmdb.ts';

import {createQueryResolver} from '../shared/resolvers.ts';
import {loadTmdbSeries} from '../shared/tmdb.ts';

export const Query = createQueryResolver({
  async search(_, {query}, {prisma, env}) {
    if (!query?.length) {
      return {series: []};
    }

    const {results} = await tmdbFetch<{results: any[]}>(
      `/search/tv?query=${encodeURIComponent(query)}`,
      {accessToken: env.TMDB_ACCESS_TOKEN},
    );
    const cappedResults = results.slice(0, 12);
    const existingSeries =
      cappedResults.length > 0
        ? await prisma.series.findMany({
            where: {tmdbId: {in: cappedResults.map(({id}) => String(id))}},
          })
        : [];

    const idToResult = new Map(
      existingSeries.map((series) => [series.tmdbId, series]),
    );
    const unmatchedSeries = cappedResults.filter(
      ({id}) => !idToResult.has(String(id)),
    );

    await Promise.all(
      unmatchedSeries.map(async (unmatchedSeries) => {
        const series = await loadTmdbSeries(unmatchedSeries.id, {
          prisma,
          env,
        });
        idToResult.set(series.tmdbId, series);
      }),
    );

    const returnedSeries = cappedResults.map(
      ({id}) => idToResult.get(String(id))!,
    );

    return {series: returnedSeries};
  },
});
