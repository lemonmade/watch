import type {ExtendedRequest} from '@lemon/tiny-server';
import {redirect} from '@lemon/tiny-server';

import {addAuthCookies} from 'shared/utilities/auth';

import {SearchParam} from '../constants';

export function completeAuth(
  userId: string,
  {
    request,
    redirectTo,
  }: {
    request: ExtendedRequest;
    redirectTo?: string;
  },
) {
  const redirectTarget = validateRedirectTo(redirectTo, request) ?? '/app';

  return addAuthCookies({id: userId}, redirect(redirectTarget));
}

export function restartAuth({
  request,
  redirectTo,
}: {
  request: ExtendedRequest;
  redirectTo?: string;
}) {
  const loginUrl = new URL('/login', request.url);
  const normalizedRedirectTo = validateRedirectTo(redirectTo, request);

  if (normalizedRedirectTo) {
    loginUrl.searchParams.set(SearchParam.RedirectTo, normalizedRedirectTo);
  }

  return redirect(loginUrl);
}

function validateRedirectTo(
  redirectTo: string | undefined,
  {url}: ExtendedRequest,
) {
  const normalizedRedirectTo =
    typeof redirectTo === 'string' ? new URL(redirectTo, url) : redirectTo;

  return normalizedRedirectTo && normalizedRedirectTo.origin === url.origin
    ? redirectTo
    : undefined;
}
