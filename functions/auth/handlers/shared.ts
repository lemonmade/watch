import type {Request} from '@quilted/http-handlers';
import {createPrisma} from 'shared/utilities/database';

export type {Prisma} from 'shared/utilities/database';

export function validateRedirectTo(
  redirectTo: string | undefined,
  {url}: Request,
) {
  const normalizedRedirectTo =
    typeof redirectTo === 'string' ? new URL(redirectTo, url) : redirectTo;

  return normalizedRedirectTo && normalizedRedirectTo.origin === url.origin
    ? redirectTo
    : undefined;
}

const prismaPromise = createPrisma();

export function loadPrisma() {
  return prismaPromise;
}
