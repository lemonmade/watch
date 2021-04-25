import type {Request, Response} from '@quilted/http-handlers';

import {Prisma} from 'shared/utilities/database';
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
  };
}
