import type {QueryResolver} from './types.ts';
import {tmdbFetch, loadTmdbSeries} from './shared/tmdb.ts';

export const Query: Pick<QueryResolver, 'search'> = {
  async search(_, {query}, {prisma}) {
    if (!query?.length) {
      return {series: []};
    }

    const {results} = await tmdbFetch<{results: any[]}>(
      `/search/tv?query=${encodeURIComponent(query)}`,
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
        const series = await loadTmdbSeries(unmatchedSeries.id, {prisma});
        idToResult.set(series.tmdbId, series);
      }),
    );

    const returnedSeries = cappedResults.map(
      ({id}) => idToResult.get(String(id))!,
    );

    return {series: returnedSeries};
  },
};
