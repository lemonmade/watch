import {redirect} from '@lemon/tiny-server';
import type {ExtendedRequest} from '@lemon/tiny-server';

import {
  // addAuthCookies,
  removeAuthCookies,
  verifySignedToken,
} from 'shared/utilities/auth';
// import {createDatabaseConnection, Table} from 'shared/utilities/database';

import {SearchParam} from '../../constants';

export function signInFromEmail(request: ExtendedRequest) {
  const token = request.url.searchParams.get(SearchParam.Token);
  if (token == null) return removeAuthCookies(redirect('/login'), {request});

  const decodedToken = verifySignedToken<{redirectTo?: string}>(token);

  // eslint-disable-next-line no-console
  console.log({token, decodedToken});

  const {redirectTo = '/app'} = decodedToken;

  return redirect(redirectTo);
}

export function signUpFromEmail(request: ExtendedRequest) {
  const token = request.url.searchParams.get(SearchParam.Token);
  const redirectTo =
    request.url.searchParams.get(SearchParam.RedirectTo) ?? '/app';

  // eslint-disable-next-line no-console
  console.log({token});

  return redirect(redirectTo);
}
