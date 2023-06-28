import crypto from 'crypto';
import Env from '@quilted/quilt/env';
import {
  redirect,
  html,
  EnhancedResponse,
  type EnhancedRequest,
  type CookieOptions,
} from '@quilted/quilt/request-router';
import {createGraphQLHttpFetch} from '@quilted/quilt';
import {stripIndent} from 'common-tags';
import type {Prisma as PrismaData} from '@prisma/client';

import {
  SearchParam,
  SignInErrorReason,
  CreateAccountErrorReason,
  GITHUB_OAUTH_MESSAGE_TOPIC,
  GithubOAuthFlow,
  type GithubOAuthMessage,
} from '~/global/auth.ts';

import {getUserIdFromRequest, addAuthCookies} from '../../shared/auth.ts';
import {createAccountWithGiftCode} from '../../shared/create-account.ts';
import {validateRedirectTo, createPrisma} from '../shared.ts';

import viewerQuery from './graphql/GithubViewerQuery.graphql';
import type {GithubViewerQueryData} from './graphql/GithubViewerQuery.graphql';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
  }
}

const SCOPES = 'read:user';

const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  maxAge: 60 * 5,
  sameSite: 'lax',
  secure: true,
  httpOnly: true,
};

enum Cookie {
  State = 'state',
}

enum GithubSearchParam {
  Code = 'code',
  Scope = 'scope',
  State = 'state',
  ClientId = 'client_id',
  Redirect = 'redirect_uri',
}

export function startGithubOAuth(
  request: EnhancedRequest,
  {resolveUrl}: {resolveUrl?(url: URL): URL | void} = {},
) {
  const state = crypto
    .randomBytes(15)
    .map((byte) => byte % 10)
    .join('');

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get(SearchParam.RedirectTo);

  const githubOAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubOAuthUrl.searchParams.set(
    GithubSearchParam.ClientId,
    Env.GITHUB_CLIENT_ID,
  );
  githubOAuthUrl.searchParams.set(GithubSearchParam.Scope, SCOPES);
  githubOAuthUrl.searchParams.set(GithubSearchParam.State, state);

  const callbackUrl = new URL('callback', `${url.origin}${url.pathname}/`);

  if (redirectTo) {
    callbackUrl.searchParams.set(SearchParam.RedirectTo, redirectTo);
  }

  const finalCallbackUrl = resolveUrl?.(callbackUrl) ?? callbackUrl;

  githubOAuthUrl.searchParams.set(
    GithubSearchParam.Redirect,
    finalCallbackUrl.href,
  );

  const response = redirect(githubOAuthUrl, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });

  const cookieOptions = {
    ...DEFAULT_COOKIE_OPTIONS,
    path: url.pathname,
  };

  response.cookies.set(Cookie.State, state, cookieOptions);

  return response;
}

export function handleGithubOAuthSignIn(request: EnhancedRequest) {
  return handleGithubOAuthCallback(request, {
    onFailure({request, redirectTo}) {
      return restartSignIn({
        request,
        redirectTo,
        reason: SignInErrorReason.GithubError,
      });
    },
    onSuccess({userIdFromExistingAccount, redirectTo}) {
      if (userIdFromExistingAccount) {
        // eslint-disable-next-line no-console
        console.log(
          `Found existing user during sign-in: ${userIdFromExistingAccount}`,
        );

        return completeSignIn(userIdFromExistingAccount, {
          redirectTo,
          request,
        });
      } else {
        // eslint-disable-next-line no-console
        console.log(`No user found!`);

        return restartSignIn({
          request,
          redirectTo,
          reason: SignInErrorReason.GithubNoAccount,
        });
      }
    },
  });
}

function completeSignIn(
  userId: string,
  {request, redirectTo}: {request: EnhancedRequest; redirectTo?: string},
) {
  return addAuthCookies(
    {id: userId},
    modalAuthResponse({
      request,
      event: {flow: GithubOAuthFlow.SignIn, success: true},
      redirectTo: validatedRedirectUrl(redirectTo, request),
    }),
  );
}

export function startGithubOAuthCreateAccount(request: EnhancedRequest) {
  return startGithubOAuth(request, {
    resolveUrl(url) {
      const code = new URL(request.url).searchParams.get(SearchParam.GiftCode);

      if (code) {
        url.searchParams.set(SearchParam.GiftCode, code);
      }

      return url;
    },
  });
}

export function handleGithubOAuthCreateAccount(request: EnhancedRequest) {
  const giftCode =
    new URL(request.url).searchParams.get(SearchParam.GiftCode) ?? undefined;

  return handleGithubOAuthCallback(request, {
    onFailure({request, redirectTo}) {
      return restartCreateAccount({
        redirectTo,
        request,
        giftCode,
        reason: CreateAccountErrorReason.GithubError,
      });
    },
    async onSuccess({userIdFromExistingAccount, redirectTo, githubUser}) {
      if (userIdFromExistingAccount) {
        // eslint-disable-next-line no-console
        console.log(
          `Found existing user during sign-up: ${userIdFromExistingAccount}`,
        );

        return completeCreateAccount(userIdFromExistingAccount, {
          request,
          redirectTo,
        });
      }

      const {
        id: githubUserId,
        email,
        url: githubUserUrl,
        login,
        avatarUrl,
      } = githubUser;

      try {
        const prisma = await createPrisma();

        const githubAccount: PrismaData.GithubAccountCreateWithoutUserInput = {
          id: githubUserId,
          username: login,
          profileUrl: githubUserUrl,
          avatarUrl,
        };

        // Don’t try to be clever here and give feedback to the user if
        // this failed because their email already exists. It’s tempting
        // to just log them in or tell them they have an account already,
        // but that feedback could be used to probe for emails.
        const {id: updatedUserId} = giftCode
          ? await createAccountWithGiftCode(
              {
                email,
                githubAccount: {create: githubAccount},
              },
              {giftCode, prisma},
            )
          : await prisma.user.create({
              data: {
                email,
                githubAccount: {create: githubAccount},
              },
            });

        // eslint-disable-next-line no-console
        console.log(`Created new user during sign-up: ${updatedUserId}`);

        return completeCreateAccount(updatedUserId, {redirectTo, request});
      } catch {
        return restartCreateAccount({redirectTo, request});
      }
    },
  });
}

function completeCreateAccount(
  userId: string,
  {request, redirectTo}: {request: EnhancedRequest; redirectTo?: string},
) {
  return addAuthCookies(
    {id: userId},
    modalAuthResponse({
      request,
      event: {flow: GithubOAuthFlow.CreateAccount, success: true},
      redirectTo: validatedRedirectUrl(redirectTo, request),
    }),
  );
}

export function handleGithubOAuthConnect(request: EnhancedRequest) {
  return handleGithubOAuthCallback(request, {
    onFailure({request, redirectTo}) {
      return restartConnect({redirectTo, request});
    },
    async onSuccess({userIdFromExistingAccount, redirectTo, githubUser}) {
      const userIdFromRequest = await getUserIdFromRequest(request);

      if (userIdFromExistingAccount) {
        if (userIdFromRequest === userIdFromExistingAccount) {
          // eslint-disable-next-line no-console
          console.log(
            `Found existing Github account while connecting (user: ${userIdFromExistingAccount})`,
          );

          return completeConnect(userIdFromRequest, {
            request,
            redirectTo,
          });
        } else {
          // eslint-disable-next-line no-console
          console.log(
            `Attempted to connect a Github account to user ${userIdFromRequest}, but that account is already connected to user ${userIdFromExistingAccount}`,
          );

          return restartConnect({request, redirectTo});
        }
      }

      // We are trying to connect, but there is no user signed in!
      if (userIdFromRequest == null) {
        return restartSignIn({redirectTo, request});
      }

      const {
        id: githubUserId,
        url: githubUserUrl,
        login,
        avatarUrl,
      } = githubUser;

      try {
        const prisma = await createPrisma();

        await prisma.githubAccount.create({
          data: {
            id: githubUserId,
            userId: userIdFromRequest,
            username: login,
            profileUrl: githubUserUrl,
            avatarUrl,
          },
        });

        // eslint-disable-next-line no-console
        console.log(
          `Connected Github account ${login} to user: ${userIdFromRequest}`,
        );

        return completeConnect(userIdFromRequest, {
          request,
          redirectTo,
        });
      } catch {
        // Should have better behavior here, what do we do if
        // the db request to connect the account failed? Probably
        // need a URL param for the next page to pick up
        return restartConnect({request, redirectTo});
      }
    },
  });
}

function completeConnect(
  userId: string,
  {request, redirectTo}: {request: EnhancedRequest; redirectTo?: string},
) {
  return addAuthCookies(
    {id: userId},
    modalAuthResponse({
      request,
      event: {flow: GithubOAuthFlow.Connect, success: true},
      redirectTo: validatedRedirectUrl(redirectTo, request),
    }),
  );
}

interface GithubCallbackResult {
  readonly githubUser: GithubViewerQueryData.Viewer;
  readonly redirectTo?: string;
  readonly userIdFromExistingAccount?: string;
}

enum GithubCallbackFailureReason {
  StateMismatch,
  FailedToFetchUser,
}

interface GithubCallbackFailureResult {
  readonly request: EnhancedRequest;
  readonly reason: GithubCallbackFailureReason;
  readonly redirectTo?: string;
}

async function handleGithubOAuthCallback(
  request: EnhancedRequest,
  {
    onSuccess,
    onFailure,
  }: {
    onSuccess(result: GithubCallbackResult): Response | Promise<Response>;
    onFailure(result: GithubCallbackFailureResult): EnhancedResponse;
  },
) {
  const url = new URL(request.url);
  const {cookies} = request;

  const redirectTo = url.searchParams.get(SearchParam.RedirectTo) ?? undefined;

  const expectedState = cookies.get(Cookie.State);
  const code = url.searchParams.get(GithubSearchParam.Code);
  const state = url.searchParams.get(GithubSearchParam.State);

  if (expectedState == null || expectedState !== state) {
    return onFailure({
      reason: GithubCallbackFailureReason.StateMismatch,
      request,
      redirectTo,
    });
  }

  const accessTokenResponse = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      body: JSON.stringify({
        client_id: Env.GITHUB_CLIENT_ID,
        client_secret: Env.GITHUB_CLIENT_SECRET,
        code,
        state,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      // @see https://github.com/nodejs/node/issues/46221
      ...{duplex: 'half'},
    },
  );

  const accessTokenJson = (await accessTokenResponse.json()) as {
    access_token: string;
  };

  const {access_token: accessToken} = accessTokenJson;

  const queryGithub = createGraphQLHttpFetch({
    url: 'https://api.github.com/graphql',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const {data: githubResult, errors: githubErrors} = await queryGithub(
    viewerQuery,
  );

  if (githubErrors != null) {
    // eslint-disable-next-line no-console
    console.error('Github error');
    // eslint-disable-next-line no-console
    console.error(githubErrors);
  }

  if (githubResult == null) {
    // eslint-disable-next-line no-console
    console.log('No result fetched from Github!');
    return onFailure({
      request,
      redirectTo,
      reason: GithubCallbackFailureReason.FailedToFetchUser,
    });
  }

  const prisma = await createPrisma();
  const account = await prisma.githubAccount.findFirst({
    where: {id: githubResult.viewer.id},
    select: {userId: true},
  });

  const response = await onSuccess({
    redirectTo,
    githubUser: githubResult.viewer,
    userIdFromExistingAccount: account?.userId,
  });

  return response;
}

function restartSignIn({
  request,
  reason = SignInErrorReason.Generic,
  redirectTo,
}: {
  request: EnhancedRequest;
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

  return modalAuthResponse({
    request,
    redirectTo: signInUrl,
    event: {flow: GithubOAuthFlow.SignIn, success: false, reason},
  });
}

function restartCreateAccount({
  request,
  reason = CreateAccountErrorReason.Generic,
  giftCode,
  redirectTo,
}: {
  request: EnhancedRequest;
  reason?: CreateAccountErrorReason;
  giftCode?: string;
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

  if (giftCode) {
    createAccountUrl.searchParams.set(SearchParam.GiftCode, giftCode);
  }

  return modalAuthResponse({
    request,
    redirectTo: createAccountUrl,
    event: {flow: GithubOAuthFlow.CreateAccount, success: false, reason},
  });
}

function restartConnect({
  request,
  redirectTo,
}: {
  request: EnhancedRequest;
  redirectTo?: string;
}) {
  const targetUrl = validatedRedirectUrl(redirectTo, request);

  return modalAuthResponse({
    request,
    redirectTo: targetUrl,
    event: {flow: GithubOAuthFlow.Connect, success: false},
  });
}

function validatedRedirectUrl(redirect: string | undefined, request: Request) {
  return new URL(validateRedirectTo(redirect, request) ?? '/app', request.url);
}

function modalAuthResponse({
  event,
  redirectTo,
  request,
}: {
  event: Omit<GithubOAuthMessage, 'topic' | 'redirectTo'>;
  redirectTo: URL;
  request: EnhancedRequest;
}) {
  const content = stripIndent`
    <html>
      <script>
        try {
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(
              JSON.stringify({
                topic: GITHUB_OAUTH_MESSAGE_TOPIC,
                redirectTo: redirectTo.href,
                ...event,
              }),
            )}, ${JSON.stringify(new URL(request.url).origin)})
          } else {
            window.location.replace(${JSON.stringify(redirectTo.href)});
          }
        } catch (error) {
          window.location.replace(${JSON.stringify(redirectTo.href)});
        }
      </script>
    </html>
  `;

  return deleteOAuthCookies(
    html(content, {
      headers: {
        'Cache-Control': 'no-store',
      },
    }),
    {request},
  );
}

function deleteOAuthCookies(
  response: EnhancedResponse,
  {request}: {request?: EnhancedRequest},
) {
  if (request == null || request.cookies.has(Cookie.State)) {
    response.cookies.delete(Cookie.State);
  }

  return response;
}
