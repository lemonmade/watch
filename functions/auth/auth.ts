import {createApp, redirect} from '@lemon/tiny-server';

import {SearchParam, ROOT_PATH} from './constants';
import {signInFromEmail, signUpFromEmail} from './handlers/email';
import {startGithubOAuth, handleGithubOAuthCallback} from './handlers/github';

const app = createApp({prefix: ROOT_PATH});

app.get('/email/sign-in', signInFromEmail);
app.get('/email/sign-up', signUpFromEmail);

app.get('/github/sign-in', startGithubOAuth);
app.get('/github/sign-in/callback', (request) =>
  handleGithubOAuthCallback(request, {signUp: false}),
);

app.get('/github/sign-up', startGithubOAuth);
app.get('/github/sign-up/callback', (request) =>
  handleGithubOAuthCallback(request, {signUp: true}),
);

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
