import DataLoader from 'dataloader';

export enum Table {
  Users = 'Users',
  Watches = 'Watches',
  Skips = 'Skips',
  Series = 'Series',
  SeriesSubscriptions = 'SeriesSubscriptions',
  Seasons = 'Seasons',
  Episodes = 'Episodes',
  WatchThroughs = 'WatchThroughs',
  WatchThroughEpisodes = 'WatchThroughEpisodes',
  Apps = 'Apps',
  ClipsExtensions = 'ClipsExtensions',
  ClipsExtensionVersions = 'ClipsExtensionVersions',
  AppInstallations = 'AppInstallations',
  ClipsExtensionInstallations = 'ClipsExtensionInstallations',
  GithubAccounts = 'GithubAccounts',
}

export type Context = ReturnType<typeof createContext>;

export function createContext(db: import('knex'), user: {id: string}) {
  return {
    db,
    user,
    userLoader: new DataLoader(createBatchLoaderForTable(db, Table.Users)),
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
    appsLoader: new DataLoader(createBatchLoaderForTable(db, Table.Apps)),
    clipsExtensionsLoader: new DataLoader(
      createBatchLoaderForTable(db, Table.ClipsExtensions),
    ),
    appInstallationsLoader: new DataLoader(
      createBatchLoaderForTable(db, Table.AppInstallations),
    ),
    clipsExtensionInstallationsLoader: new DataLoader(
      createBatchLoaderForTable(db, Table.ClipsExtensionInstallations),
    ),
    clipsExtensionVersionsLoader: new DataLoader(
      createBatchLoaderForTable(db, Table.ClipsExtensionVersions),
    ),
    githubAccountsLoader: new DataLoader(
      createBatchLoaderForTable(db, Table.GithubAccounts),
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
