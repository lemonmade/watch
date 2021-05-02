import type {Request, Response} from '@quilted/http-handlers';

import {createPrisma} from 'shared/utilities/database';

type ThenType<T> = T extends Promise<infer U> ? U : never;
export type Context = ThenType<ReturnType<typeof createContext>>;

interface MutableResponse {
  status: Response['status'];
  readonly headers: Response['headers'];
  readonly cookies: Response['cookies'];
}

export async function createContext(
  user: {id: string} | undefined,
  request: Request,
  response: MutableResponse,
) {
  const prisma = await createPrisma();

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
