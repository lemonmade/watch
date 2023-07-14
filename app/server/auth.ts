import {createRequestRouter, redirect} from '@quilted/quilt/request-router';

import {SearchParam} from '~/global/auth.ts';

import {signInFromEmail, createAccountFromEmail} from './auth/email.ts';
import {
  startGithubOAuth,
  handleGithubOAuthSignIn,
  startGithubOAuthCreateAccount,
  handleGithubOAuthCreateAccount,
  handleGithubOAuthConnect,
} from './auth/github.ts';
import {
  startGoogleOAuth,
  handleGoogleOAuthSignIn,
  startGoogleOAuthCreateAccount,
  handleGoogleOAuthCreateAccount,
  handleGoogleOAuthConnect,
} from './auth/google.ts';
import {handleAppleCallback} from './auth/apple.ts';

const router = createRequestRouter();

router.get('/email/sign-in', signInFromEmail);
router.get('/email/create-account', createAccountFromEmail);

router.get('/apple/sign-in/callback', handleAppleCallback);
router.get('/apple/create-account/callback', handleAppleCallback);
router.get('/apple/connect/callback', handleAppleCallback);

router.get('/github/sign-in', startGithubOAuth);
router.get('/github/sign-in/callback', handleGithubOAuthSignIn);
router.get('/github/create-account', startGithubOAuthCreateAccount);
router.get('/github/create-account/callback', handleGithubOAuthCreateAccount);
router.get('/github/connect', startGithubOAuth);
router.get('/github/connect/callback', handleGithubOAuthConnect);

router.get('/google/sign-in', startGoogleOAuth);
router.get('/google/sign-in/callback', handleGoogleOAuthSignIn);
router.get('/google/create-account', startGoogleOAuthCreateAccount);
router.get('/google/create-account/callback', handleGoogleOAuthCreateAccount);
router.get('/google/connect', startGoogleOAuth);
router.get('/google/connect/callback', handleGoogleOAuthConnect);

router.get((request) => {
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

export default router;
