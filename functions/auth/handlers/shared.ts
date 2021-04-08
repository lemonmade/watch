import type {ExtendedRequest} from '@lemon/tiny-server';

export function validateRedirectTo(
  redirectTo: string | undefined,
  {url}: ExtendedRequest,
) {
  const normalizedRedirectTo =
    typeof redirectTo === 'string' ? new URL(redirectTo, url) : redirectTo;

  return normalizedRedirectTo && normalizedRedirectTo.origin === url.origin
    ? redirectTo
    : undefined;
}
