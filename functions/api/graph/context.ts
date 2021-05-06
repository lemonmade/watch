import type {Request, Response} from '@quilted/http-handlers';

import type {Prisma} from 'shared/utilities/database';

export type Context = ReturnType<typeof createContext>;

interface MutableResponse {
  status: Response['status'];
  readonly headers: Response['headers'];
  readonly cookies: Response['cookies'];
}

export type Authentication =
  | {
      type: 'unauthenticated';
      userId?: never;
    }
  | {type: 'cookie'; userId: string}
  | {type: 'accessToken'; userId: string};

export function createContext(
  auth: Authentication,
  prisma: Prisma,
  request: Request,
  response: MutableResponse,
) {
  return {
    prisma,
    get user() {
      if (auth.userId == null) {
        response.status = 401;
        throw new Error('No user exists for this request!');
      }

      return {id: auth.userId};
    },
    request,
    response,
  };
}
