import type {Request} from '@quilted/http-handlers';

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
