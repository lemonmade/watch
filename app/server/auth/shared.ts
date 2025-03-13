export function validateRedirectTo(
  redirectTo: string | undefined,
  request: Request,
) {
  const url = new URL(request.url);
  const normalizedRedirectTo =
    typeof redirectTo === 'string' ? new URL(redirectTo, url) : redirectTo;

  return normalizedRedirectTo && normalizedRedirectTo.origin === url.origin
    ? redirectTo
    : undefined;
}
