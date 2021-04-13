import {createHttpHandler, redirect} from '@quilted/http-handlers';

import {SearchParam, ROOT_PATH} from './constants';
import {signInFromEmail, createAccountFromEmail} from './handlers/email';
import {
  startGithubOAuth,
  handleGithubOAuthSignIn,
  handleGithubOAuthCreateAccount,
  handleGithubOAuthConnect,
} from './handlers/github';

const app = createHttpHandler({prefix: ROOT_PATH});

app.get('/email/sign-in', signInFromEmail);
app.get('/email/create-account', createAccountFromEmail);

app.get('/github/sign-in', startGithubOAuth);
app.get('/github/sign-in/callback', handleGithubOAuthSignIn);

app.get('/github/create-account', startGithubOAuth);
app.get('/github/create-account/callback', handleGithubOAuthCreateAccount);

app.get('/github/connect', startGithubOAuth);
app.get('/github/connect/callback', handleGithubOAuthConnect);

app.get((request) => {
  // eslint-disable-next-line no-console
  console.log('Fallback route');

  const loginUrl = new URL('/login', request.url);
  const redirectTo = request.url.searchParams.get(SearchParam.RedirectTo);

  if (redirectTo) {
    loginUrl.searchParams.set(SearchParam.RedirectTo, redirectTo);
  }

  return redirect(loginUrl);
});

export default app;
