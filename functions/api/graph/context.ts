import DataLoader from 'dataloader';
import type {Request, Response} from '@quilted/http-handlers';

import {Table, Prisma} from 'shared/utilities/database';
import type {Database} from 'shared/utilities/database';

export type Context = ReturnType<typeof createContext>;

interface MutableResponse {
  status: Response['status'];
  readonly headers: Response['headers'];
  readonly cookies: Response['cookies'];
}

export function createContext(
  db: Database,
  user: {id: string} | undefined,
  request: Request,
  response: MutableResponse,
) {
  return {
    db,
    prisma: new Prisma(),
    get user() {
      if (user == null) {
        response.status = 401;
        throw new Error('No user exists for this request!');
      }

      return user;
    },
    request,
    response,
    watchLoader: new DataLoader(
      createUserScopedBatchLoaderForTable(db, Table.Watches, response, user),
    ),
    skipLoader: new DataLoader(
      createUserScopedBatchLoaderForTable(db, Table.Skips, response, user),
    ),
    seriesLoader: new DataLoader(createBatchLoaderForTable(db, Table.Series)),
    seriesSubscriptionsLoader: new DataLoader(
      createUserScopedBatchLoaderForTable(
        db,
        Table.SeriesSubscriptions,
        response,
        user,
      ),
    ),
    seasonLoader: new DataLoader(createBatchLoaderForTable(db, Table.Seasons)),
    episodeLoader: new DataLoader(
      createBatchLoaderForTable(db, Table.Episodes),
    ),
    watchThroughLoader: new DataLoader(
      createUserScopedBatchLoaderForTable(
        db,
        Table.WatchThroughs,
        response,
        user,
      ),
    ),
  };
}

function createUserScopedBatchLoaderForTable(
  db: import('knex'),
  table: Table,
  response: MutableResponse,
  user: {id: string} | undefined,
) {
  return async (ids: readonly string[]) => {
    if (user == null) {
      response.status = 401;
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
