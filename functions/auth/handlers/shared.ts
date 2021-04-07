import type {ExtendedRequest} from '@lemon/tiny-server';
import {redirect} from '@lemon/tiny-server';

import {addAuthCookies} from 'shared/utilities/auth';

import {
  SearchParam,
  SignInErrorReason,
  CreateAccountErrorReason,
} from '../constants';

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

export function restartSignIn({
  request,
  reason = SignInErrorReason.Generic,
  redirectTo,
}: {
  request: ExtendedRequest;
  reason?: SignInErrorReason;
  redirectTo?: string;
}) {
  const signInUrl = new URL('/sign-in', request.url);

  if (reason) {
    signInUrl.searchParams.set(SearchParam.Reason, reason);
  }

  const normalizedRedirectTo = validateRedirectTo(redirectTo, request);

  if (normalizedRedirectTo) {
    signInUrl.searchParams.set(SearchParam.RedirectTo, normalizedRedirectTo);
  }

  return redirect(signInUrl, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export function restartCreateAccount({
  request,
  reason = CreateAccountErrorReason.Generic,
  redirectTo,
}: {
  request: ExtendedRequest;
  reason?: CreateAccountErrorReason;
  redirectTo?: string;
}) {
  const createAccountUrl = new URL('/create-account', request.url);

  if (reason) {
    createAccountUrl.searchParams.set(SearchParam.Reason, reason);
  }

  const normalizedRedirectTo = validateRedirectTo(redirectTo, request);

  if (normalizedRedirectTo) {
    createAccountUrl.searchParams.set(
      SearchParam.RedirectTo,
      normalizedRedirectTo,
    );
  }

  return redirect(createAccountUrl, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

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
