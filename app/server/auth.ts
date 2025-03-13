import {Hono} from 'hono';
import {RedirectResponse} from '@quilted/quilt/request-router';

import {SearchParam} from '~/global/auth.ts';

import {signInFromEmail, createAccountFromEmail} from './auth/email.ts';
import {
  handleStartGithubOAuth,
  handleGithubOAuthSignIn,
  handleStartGithubOAuthCreateAccount,
  handleGithubOAuthCreateAccount,
  handleGithubOAuthConnect,
} from './auth/github.ts';
import {
  handleStartGoogleOAuth,
  handleGoogleOAuthSignIn,
  handleStartGoogleOAuthCreateAccount,
  handleGoogleOAuthCreateAccount,
  handleGoogleOAuthConnect,
} from './auth/google.ts';
import {handleAppleCallback} from './auth/apple.ts';

import {createResponseHandler} from './shared/response.ts';

const routes = new Hono();

routes.get('/email/sign-in', signInFromEmail);
routes.get('/email/create-account', createAccountFromEmail);

routes.get('/apple/sign-in/callback', handleAppleCallback);
routes.get('/apple/create-account/callback', handleAppleCallback);
routes.get('/apple/connect/callback', handleAppleCallback);

routes.get('/github/sign-in', handleStartGithubOAuth);
routes.get('/github/sign-in/callback', handleGithubOAuthSignIn);
routes.get('/github/create-account', handleStartGithubOAuthCreateAccount);
routes.get('/github/create-account/callback', handleGithubOAuthCreateAccount);
routes.get('/github/connect', handleStartGithubOAuth);
routes.get('/github/connect/callback', handleGithubOAuthConnect);

routes.get('/google/sign-in', handleStartGoogleOAuth);
routes.get('/google/sign-in/callback', handleGoogleOAuthSignIn);
routes.get('/google/create-account', handleStartGoogleOAuthCreateAccount);
routes.get('/google/create-account/callback', handleGoogleOAuthCreateAccount);
routes.get('/google/connect', handleStartGoogleOAuth);
routes.get('/google/connect/callback', handleGoogleOAuthConnect);

routes.get(
  '*',
  createResponseHandler((request) => {
    console.log('Fallback route', request.url);

    const loginUrl = new URL('/login', request.url);
    const redirectTo = request.URL.searchParams.get(SearchParam.RedirectTo);

    if (redirectTo) {
      loginUrl.searchParams.set(SearchParam.RedirectTo, redirectTo);
    }

    return new RedirectResponse(loginUrl);
  }),
);

export default routes;
