import DataLoader from 'dataloader';

export enum Table {
  Watches = 'Watches',
  Skips = 'Skips',
  Series = 'Series',
  SeriesSubscriptions = 'SeriesSubscriptions',
  Seasons = 'Seasons',
  Episodes = 'Episodes',
  WatchThroughs = 'WatchThroughs',
  WatchThroughEpisodes = 'WatchThroughEpisodes',
}

export type Context = ReturnType<typeof createContext>;

export function createContext(db: import('knex')) {
  return {
    db,
    watchLoader: new DataLoader(createBatchLoaderForTable(db, Table.Watches)),
    skipLoader: new DataLoader(createBatchLoaderForTable(db, Table.Skips)),
    seriesLoader: new DataLoader(createBatchLoaderForTable(db, Table.Series)),
    seriesSubscriptionsLoader: new DataLoader(
      createBatchLoaderForTable(db, Table.SeriesSubscriptions),
    ),
    seasonLoader: new DataLoader(createBatchLoaderForTable(db, Table.Seasons)),
    episodeLoader: new DataLoader(
      createBatchLoaderForTable(db, Table.Episodes),
    ),
    watchThroughLoader: new DataLoader(
      createBatchLoaderForTable(db, Table.WatchThroughs),
    ),
  };
}

function createBatchLoaderForTable(db: import('knex'), table: Table) {
  return async (ids: readonly string[]) => {
    const results = ((await db
      .select<{id: string}>('*')
      .from(table)
      .whereIn('id', ids as string[])) as any) as {id: string}[];

    return ids.map((id, index) =>
      results[index] && results[index].id === id
        ? results[index]
        : results.find((result) => result.id === id) || null,
    );
  };
}
