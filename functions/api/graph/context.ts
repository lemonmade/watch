import DataLoader from 'dataloader';
import type {ExtendedRequest, ExtendedResponse} from '@lemon/tiny-server';
import {Table} from 'shared/utilities/database';
import type {Database} from 'shared/utilities/database';

export type Context = ReturnType<typeof createContext>;

export function createContext(
  db: Database,
  user: {id: string} | undefined,
  request: ExtendedRequest,
  response: ExtendedResponse,
) {
  return {
    db,
    get user() {
      if (user == null) {
        throw new Error('No user exists for this request!');
      }

      return user;
    },
    request,
    response,
    userLoader: new DataLoader(createBatchLoaderForTable(db, Table.Users)),
    watchLoader: new DataLoader(
      createUserScopedBatchLoaderForTable(db, Table.Watches, user),
    ),
    skipLoader: new DataLoader(
      createUserScopedBatchLoaderForTable(db, Table.Skips, user),
    ),
    seriesLoader: new DataLoader(createBatchLoaderForTable(db, Table.Series)),
    seriesSubscriptionsLoader: new DataLoader(
      createUserScopedBatchLoaderForTable(db, Table.SeriesSubscriptions, user),
    ),
    seasonLoader: new DataLoader(createBatchLoaderForTable(db, Table.Seasons)),
    episodeLoader: new DataLoader(
      createBatchLoaderForTable(db, Table.Episodes),
    ),
    watchThroughLoader: new DataLoader(
      createUserScopedBatchLoaderForTable(db, Table.WatchThroughs, user),
    ),
    appsLoader: new DataLoader(createBatchLoaderForTable(db, Table.Apps)),
    clipsExtensionsLoader: new DataLoader(
      createBatchLoaderForTable(db, Table.ClipsExtensions),
    ),
    appInstallationsLoader: new DataLoader(
      createUserScopedBatchLoaderForTable(db, Table.AppInstallations, user),
    ),
    clipsExtensionInstallationsLoader: new DataLoader(
      createUserScopedBatchLoaderForTable(
        db,
        Table.ClipsExtensionInstallations,
        user,
      ),
    ),
    clipsExtensionVersionsLoader: new DataLoader(
      createBatchLoaderForTable(db, Table.ClipsExtensionVersions),
    ),
    githubAccountsLoader: new DataLoader(
      createUserScopedBatchLoaderForTable(db, Table.GithubAccounts, user),
    ),
  };
}

function createUserScopedBatchLoaderForTable(
  db: import('knex'),
  table: Table,
  user: {id: string} | undefined,
) {
  return async (ids: readonly string[]) => {
    if (user == null) {
      throw new Error(`Need a user for ${table}!`);
    }

    const results = ((await db
      .select<{id: string}>('*')
      .from(table)
      .where({userId: user.id})
      .whereIn('id', ids as string[])) as any) as {id: string}[];

    return ids.map((id, index) =>
      results[index] && results[index].id === id
        ? results[index]
        : results.find((result) => result.id === id) || null,
    );
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
