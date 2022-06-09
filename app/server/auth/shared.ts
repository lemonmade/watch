import type {Request} from '@quilted/quilt/http-handlers';

export {createPrisma} from '../shared/database';
export type {Prisma} from '../shared/database';

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
