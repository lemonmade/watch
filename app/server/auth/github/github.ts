import crypto from 'crypto';
import {
  HTMLResponse,
  RedirectResponse,
  EnhancedResponse,
  type EnhancedRequest,
  type CookieOptions,
} from '@quilted/quilt/request-router';
import {createGraphQLFetch} from '@quilted/quilt/graphql';
import type {Prisma as PrismaData} from '@prisma/client';
import {stripIndent} from 'common-tags';
import type {ContextVariableMap} from 'hono';

import {
  SearchParam,
  SignInErrorReason,
  CreateAccountErrorReason,
  GITHUB_OAUTH_MESSAGE_TOPIC,
  GithubOAuthFlow,
  type GithubOAuthMessage,
} from '~/global/auth.ts';

import type {Environment} from '../../context.ts';

import {getUserIdFromRequest, addAuthCookies} from '../../shared/auth.ts';
import {createAccountWithGiftCode} from '../../shared/create-account.ts';
import {createResponseHandler} from '../../shared/response.ts';

import {validateRedirectTo} from '../shared.ts';

import viewerQuery from './graphql/GithubViewerQuery.graphql';
import type {GithubViewerQueryData} from './graphql/GithubViewerQuery.graphql';

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

async function startGithubOAuth(
  request: EnhancedRequest,
  {env, resolveUrl}: {env: Environment; resolveUrl?(url: URL): URL | void},
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
    env.GITHUB_CLIENT_ID,
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

  const response = new RedirectResponse(githubOAuthUrl, {
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

export const handleStartGithubOAuth = createResponseHandler(
  async function handleStartGithubOAuth(request, {env}) {
    return startGithubOAuth(request, {env});
  },
);

export const handleGithubOAuthSignIn = createResponseHandler(
  async function handleGithubOAuthSignIn(
    request,
    {env, var: {prisma: prismaContext}},
  ) {
    return handleGithubOAuthCallback(request, {
      env,
      prisma: prismaContext,
      onFailure({request, redirectTo}) {
        return restartSignIn({
          request,
          redirectTo,
          reason: SignInErrorReason.GithubError,
        });
      },
      onSuccess({userIdFromExistingAccount, redirectTo}) {
        if (userIdFromExistingAccount) {
          console.log(
            `Found existing user during sign-in: ${userIdFromExistingAccount}`,
          );

          return completeSignIn(userIdFromExistingAccount, {
            env,
            redirectTo,
            request,
          });
        } else {
          console.log(`No user found!`);

          return restartSignIn({
            request,
            redirectTo,
            reason: SignInErrorReason.GithubNoAccount,
          });
        }
      },
    });
  },
);

function completeSignIn(
  userId: string,
  {
    env,
    request,
    redirectTo,
  }: {env: Environment; request: EnhancedRequest; redirectTo?: string},
) {
  return addAuthCookies(
    {id: userId},
    modalAuthResponse({
      request,
      event: {flow: GithubOAuthFlow.SignIn, success: true},
      redirectTo: validatedRedirectUrl(redirectTo, request),
    }),
    {env},
  );
}

export const handleStartGithubOAuthCreateAccount = createResponseHandler(
  async function handleStartGithubOAuthCreateAccount(request, {env}) {
    return startGithubOAuth(request, {
      env,
      resolveUrl(url) {
        const code = request.URL.searchParams.get(SearchParam.GiftCode);

        if (code) {
          url.searchParams.set(SearchParam.GiftCode, code);
        }

        return url;
      },
    });
  },
);

export const handleGithubOAuthCreateAccount = createResponseHandler(
  async function handleGithubOAuthCreateAccount(
    request,
    {env, var: {prisma: prismaContext}},
  ) {
    const giftCode =
      request.URL.searchParams.get(SearchParam.GiftCode) ?? undefined;

    return handleGithubOAuthCallback(request, {
      env,
      prisma: prismaContext,
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
          console.log(
            `Found existing user during sign-up: ${userIdFromExistingAccount}`,
          );

          return completeCreateAccount(userIdFromExistingAccount, {
            env,
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
          const prisma = await prismaContext.load();

          const githubAccount: PrismaData.GithubAccountCreateWithoutUserInput =
            {
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

          console.log(`Created new user during sign-up: ${updatedUserId}`);

          return completeCreateAccount(updatedUserId, {
            env,
            redirectTo,
            request,
          });
        } catch {
          return restartCreateAccount({redirectTo, request});
        }
      },
    });
  },
);

function completeCreateAccount(
  userId: string,
  {
    env,
    request,
    redirectTo,
  }: {env: Environment; request: EnhancedRequest; redirectTo?: string},
) {
  return addAuthCookies(
    {id: userId},
    modalAuthResponse({
      request,
      event: {flow: GithubOAuthFlow.CreateAccount, success: true},
      redirectTo: validatedRedirectUrl(redirectTo, request),
    }),
    {env},
  );
}

export const handleGithubOAuthConnect = createResponseHandler(
  async function handleGithubOAuthConnect(
    request,
    {env, var: {prisma: prismaContext}},
  ) {
    return handleGithubOAuthCallback(request, {
      env,
      prisma: prismaContext,
      onFailure({request, redirectTo}) {
        return restartConnect({redirectTo, request});
      },
      async onSuccess({userIdFromExistingAccount, redirectTo, githubUser}) {
        const userIdFromRequest = await getUserIdFromRequest(request, {env});

        if (userIdFromExistingAccount) {
          if (userIdFromRequest === userIdFromExistingAccount) {
            console.log(
              `Found existing Github account while connecting (user: ${userIdFromExistingAccount})`,
            );

            return completeConnect(userIdFromRequest, {
              env,
              request,
              redirectTo,
            });
          } else {
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
          const prisma = await prismaContext.load();

          await prisma.githubAccount.create({
            data: {
              id: githubUserId,
              userId: userIdFromRequest,
              username: login,
              profileUrl: githubUserUrl,
              avatarUrl,
            },
          });

          console.log(
            `Connected Github account ${login} to user: ${userIdFromRequest}`,
          );

          return completeConnect(userIdFromRequest, {
            env,
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
  },
);

function completeConnect(
  userId: string,
  {
    env,
    request,
    redirectTo,
  }: {env: Environment; request: EnhancedRequest; redirectTo?: string},
) {
  return addAuthCookies(
    {id: userId},
    modalAuthResponse({
      request,
      event: {flow: GithubOAuthFlow.Connect, success: true},
      redirectTo: validatedRedirectUrl(redirectTo, request),
    }),
    {env},
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
    env,
    onSuccess,
    onFailure,
    prisma: prismaContext,
  }: {
    env: Environment;
    onSuccess(result: GithubCallbackResult): Response | Promise<Response>;
    onFailure(result: GithubCallbackFailureResult): EnhancedResponse;
  } & Pick<ContextVariableMap, 'prisma'>,
) {
  const {cookies, URL: url} = request;

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
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
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

  const queryGithub = createGraphQLFetch({
    url: 'https://api.github.com/graphql',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const {data: githubResult, errors: githubErrors} =
    await queryGithub(viewerQuery);

  if (githubErrors != null) {
    console.error('Github error');
    console.error(githubErrors);
  }

  if (githubResult == null) {
    console.log('No result fetched from Github!');
    return onFailure({
      request,
      redirectTo,
      reason: GithubCallbackFailureReason.FailedToFetchUser,
    });
  }

  const prisma = await prismaContext.load();
  const account = await prisma.githubAccount.findUnique({
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
    new HTMLResponse(content, {
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
