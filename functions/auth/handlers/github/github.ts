import crypto from 'crypto';
import Env from '@quilted/quilt/env';
import {redirect, html, fetchJson} from '@quilted/quilt/http-handlers';
import type {
  Request,
  Response,
  CookieOptions,
} from '@quilted/quilt/http-handlers';
import {createGraphQLHttpFetch} from '@quilted/quilt';
import {stripIndent} from 'common-tags';

import {
  SearchParam,
  SignInErrorReason,
  CreateAccountErrorReason,
  GITHUB_OAUTH_MESSAGE_TOPIC,
  GithubOAuthFlow,
} from 'global/utilities/auth';
import type {GithubOAuthMessage} from 'global/utilities/auth';
import {getUserIdFromRequest, addAuthCookies} from 'shared/utilities/auth';

import {validateRedirectTo, loadPrisma} from '../shared';

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

export function startGithubOAuth(request: Request) {
  const state = crypto
    .randomBytes(15)
    .map((byte) => byte % 10)
    .join('');

  const redirectTo = request.url.searchParams.get(SearchParam.RedirectTo);

  const githubOAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubOAuthUrl.searchParams.set(
    GithubSearchParam.ClientId,
    Env.GITHUB_CLIENT_ID,
  );
  githubOAuthUrl.searchParams.set(GithubSearchParam.Scope, SCOPES);
  githubOAuthUrl.searchParams.set(GithubSearchParam.State, state);

  const callbackUrl = new URL(
    'callback',
    `${request.url.origin}${request.url.pathname}/`,
  );

  if (redirectTo) {
    callbackUrl.searchParams.set(SearchParam.RedirectTo, redirectTo);
  }

  githubOAuthUrl.searchParams.set(GithubSearchParam.Redirect, callbackUrl.href);

  const response = redirect(githubOAuthUrl, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });

  const cookieOptions = {
    ...DEFAULT_COOKIE_OPTIONS,
    path: request.url.pathname,
  };

  response.cookies.set(Cookie.State, state, cookieOptions);

  return response;
}

export function handleGithubOAuthSignIn(request: Request) {
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
  {request, redirectTo}: {request: Request; redirectTo?: string},
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

export function handleGithubOAuthCreateAccount(request: Request) {
  return handleGithubOAuthCallback(request, {
    onFailure({request, redirectTo}) {
      return restartCreateAccount({
        redirectTo,
        request,
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
        const prisma = await loadPrisma();

        // Don’t try to be clever here and give feedback to the user if
        // this failed because their email already exists. It’s tempting
        // to just log them in or tell them they have an account already,
        // but that feedback could be used to probe for emails.
        const {id: updatedUserId} = await prisma.user.create({
          data: {
            email,
            githubAccount: {
              create: {
                id: githubUserId,
                username: login,
                profileUrl: githubUserUrl,
                avatarUrl,
              },
            },
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
  {request, redirectTo}: {request: Request; redirectTo?: string},
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

export function handleGithubOAuthConnect(request: Request) {
  return handleGithubOAuthCallback(request, {
    onFailure({request, redirectTo}) {
      return restartConnect({redirectTo, request});
    },
    async onSuccess({userIdFromExistingAccount, redirectTo, githubUser}) {
      const userIdFromRequest = getUserIdFromRequest(request);

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
        const prisma = await loadPrisma();

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
  {request, redirectTo}: {request: Request; redirectTo?: string},
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
  readonly request: Request;
  readonly reason: GithubCallbackFailureReason;
  readonly redirectTo?: string;
}

async function handleGithubOAuthCallback(
  request: Request,
  {
    onSuccess,
    onFailure,
  }: {
    onSuccess(result: GithubCallbackResult): Response | Promise<Response>;
    onFailure(result: GithubCallbackFailureResult): Response;
  },
) {
  const {url, cookies} = request;

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

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const {access_token: accessToken} = await fetchJson<{access_token: string}>(
    'https://github.com/login/oauth/access_token',
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      client_id: Env.GITHUB_CLIENT_ID,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      client_secret: Env.GITHUB_CLIENT_SECRET,
      code,
      state,
    },
  );

  const queryGithub = createGraphQLHttpFetch({
    uri: 'https://api.github.com/graphql',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
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

  const prisma = await loadPrisma();
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
  request: Request;
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
  redirectTo,
}: {
  request: Request;
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
  request: Request;
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
  request: Request;
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
            )}, ${JSON.stringify(request.url.origin)})
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
  response: Response,
  {request}: {request?: Request},
) {
  if (request == null || request.cookies.has(Cookie.State)) {
    response.cookies.delete(Cookie.State);
  }

  return response;
}
