import {createHttpHandler, redirect} from '@quilted/quilt/http-handlers';

import {SearchParam} from '~/global/auth';

import {signInFromEmail, createAccountFromEmail} from './auth/email';
import {
  startGithubOAuth,
  handleGithubOAuthSignIn,
  handleGithubOAuthCreateAccount,
  handleGithubOAuthConnect,
} from './auth/github';

const handler = createHttpHandler();

handler.get('/email/sign-in', signInFromEmail);
handler.get('/email/create-account', createAccountFromEmail);

handler.get('/github/sign-in', startGithubOAuth);
handler.get('/github/sign-in/callback', handleGithubOAuthSignIn);

handler.get('/github/create-account', startGithubOAuth);
handler.get('/github/create-account/callback', handleGithubOAuthCreateAccount);

handler.get('/github/connect', startGithubOAuth);
handler.get('/github/connect/callback', handleGithubOAuthConnect);

handler.get((request) => {
  // eslint-disable-next-line no-console
  console.log('Fallback route', request.url.href);

  const loginUrl = new URL('/login', request.url);
  const redirectTo = request.url.searchParams.get(SearchParam.RedirectTo);

  if (redirectTo) {
    loginUrl.searchParams.set(SearchParam.RedirectTo, redirectTo);
  }

  return redirect(loginUrl);
});

export default handler;
