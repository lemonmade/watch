import type {Request, Response} from '@quilted/quilt/http-handlers';

import type {Prisma} from '../../shared/database';

export interface Context {
  readonly user: {id: string};
  readonly prisma: Prisma;
  readonly request: Request;
  readonly response: MutableResponse;
}

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
): Context {
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
