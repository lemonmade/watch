import {createHttpHandler, redirect} from '@quilted/quilt/http-handlers';

import {SearchParam} from '~/global/auth';

import {signInFromEmail, createAccountFromEmail} from './auth/email';
import {
  startGithubOAuth,
  handleGithubOAuthSignIn,
  handleGithubOAuthCreateAccount,
  handleGithubOAuthConnect,
} from './auth/github';
import {
  startGoogleOAuth,
  handleGoogleOAuthSignIn,
  handleGoogleOAuthCreateAccount,
  handleGoogleOAuthConnect,
} from './auth/google';

const handler = createHttpHandler();

handler.get('/email/sign-in', signInFromEmail);
handler.get('/email/create-account', createAccountFromEmail);

handler.get('/github/sign-in', startGithubOAuth);
handler.get('/github/sign-in/callback', handleGithubOAuthSignIn);
handler.get('/github/create-account', startGithubOAuth);
handler.get('/github/create-account/callback', handleGithubOAuthCreateAccount);
handler.get('/github/connect', startGithubOAuth);
handler.get('/github/connect/callback', handleGithubOAuthConnect);

handler.get('/google/sign-in', startGoogleOAuth);
handler.get('/google/sign-in/callback', handleGoogleOAuthSignIn);
handler.get('/google/create-account', startGoogleOAuth);
handler.get('/google/create-account/callback', handleGoogleOAuthCreateAccount);
handler.get('/google/connect', startGoogleOAuth);
handler.get('/google/connect/callback', handleGoogleOAuthConnect);

handler.get((request) => {
  const url = new URL(request.url);

  // eslint-disable-next-line no-console
  console.log('Fallback route', url.href);

  const loginUrl = new URL('/login', url);
  const redirectTo = url.searchParams.get(SearchParam.RedirectTo);

  if (redirectTo) {
    loginUrl.searchParams.set(SearchParam.RedirectTo, redirectTo);
  }

  return redirect(loginUrl);
});

export default handler;
