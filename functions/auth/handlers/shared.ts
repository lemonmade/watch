import type {ExtendedRequest} from '@lemon/tiny-server';
import {redirect} from '@lemon/tiny-server';

import {addAuthCookies} from 'shared/utilities/auth';

import {SearchParam, SignInErrorReason} from '../constants';

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

export function restartSignIn({
  request,
  reason = SignInErrorReason.Expired,
  redirectTo,
}: {
  request: ExtendedRequest;
  reason?: SignInErrorReason;
  redirectTo?: string;
}) {
  const signInUrl = new URL('/sign-in', request.url);
  signInUrl.searchParams.set(SearchParam.Reason, reason);

  const normalizedRedirectTo = validateRedirectTo(redirectTo, request);

  if (normalizedRedirectTo) {
    signInUrl.searchParams.set(SearchParam.RedirectTo, normalizedRedirectTo);
  }

  return redirect(signInUrl);
}

export function restartConnect({
  request,
  redirectTo,
}: {
  request: ExtendedRequest;
  redirectTo?: string;
}) {
  return redirect(validateRedirectTo(redirectTo, request) ?? '/app');
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
