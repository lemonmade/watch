import type {Request, Response} from '@quilted/http-handlers';

import {Prisma} from 'shared/utilities/database';

export type Context = ReturnType<typeof createContext>;

interface MutableResponse {
  status: Response['status'];
  readonly headers: Response['headers'];
  readonly cookies: Response['cookies'];
}

const prisma = new Prisma();

export function createContext(
  user: {id: string} | undefined,
  request: Request,
  response: MutableResponse,
) {
  return {
    prisma,
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
