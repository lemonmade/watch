import crypto from 'crypto';
import {createGraphQL, createHttpFetch} from '@quilted/graphql';
import {redirect, html, fetchJson} from '@quilted/http-handlers';
import type {Request, Response, CookieDefinition} from '@quilted/http-handlers';
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
import {createDatabaseConnection, Table} from 'shared/utilities/database';
import type {Database} from 'shared/utilities/database';

import {validateRedirectTo} from '../shared';

import viewerQuery from './graphql/GithubViewerQuery.graphql';
import type {GithubViewerQueryData} from './graphql/GithubViewerQuery.graphql';

const CLIENT_ID = '60c6903025bfd274db53';
const SCOPES = 'read:user';

const DEFAULT_COOKIE_OPTIONS: Omit<CookieDefinition, 'value'> = {
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

  const id = request.url.searchParams.get(SearchParam.Id);

  if (id == null) {
    throw new Error('No ID found!');
  }

  const redirectTo = request.url.searchParams.get(SearchParam.RedirectTo);

  const githubOAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubOAuthUrl.searchParams.set(GithubSearchParam.ClientId, CLIENT_ID);
  githubOAuthUrl.searchParams.set(GithubSearchParam.Scope, SCOPES);
  githubOAuthUrl.searchParams.set(GithubSearchParam.State, state);

  const callbackUrl = new URL(
    'callback',
    `${request.url.origin}${request.url.pathname}/`,
  );

  callbackUrl.searchParams.set(SearchParam.Id, id);

  if (redirectTo) {
    callbackUrl.searchParams.set(SearchParam.RedirectTo, redirectTo);
  }

  githubOAuthUrl.searchParams.set(
    GithubSearchParam.Redirect,
    new URL('callback', `${request.url.origin}${request.url.pathname}/`).href,
  );

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
    async onSuccess({db, userIdFromExistingAccount, redirectTo, githubUser}) {
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
        // Don’t try to be clever here and give feedback to the user if
        // this failed because their email already exists. It’s tempting
        // to just log them in or tell them they have an account already,
        // but that feedback could be used to probe for emails.
        const updatedUserId = await db.transaction(async (trx) => {
          const [userId] = await trx
            .insert({email})
            .into(Table.Users)
            .returning<string>('id');

          await trx
            .insert({
              id: githubUserId,
              userId,
              username: login,
              profileUrl: githubUserUrl,
              avatarUrl,
            })
            .into(Table.GithubAccounts);

          return userId;
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
    async onSuccess({db, userIdFromExistingAccount, redirectTo, githubUser}) {
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
        await db
          .insert({
            id: githubUserId,
            userId: userIdFromRequest,
            username: login,
            profileUrl: githubUserUrl,
            avatarUrl,
          })
          .into(Table.GithubAccounts);

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
  readonly db: Database;
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

const db = createDatabaseConnection();

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

  const id = url.searchParams.get(SearchParam.Id);
  const redirectTo = url.searchParams.get(SearchParam.RedirectTo) ?? undefined;

  if (id == null) {
    throw new Error('No ID found!');
  }

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

  const {access_token: accessToken} = await fetchJson<{access_token: string}>(
    'https://github.com/login/oauth/access_token',
    {
      client_id: CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      state,
    },
  );

  const githubClient = createGraphQL({
    cache: false,
    fetch: createHttpFetch({
      uri: 'https://api.github.com/graphql',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }),
  });

  const {data: githubResult, error: githubError} = await githubClient.query(
    viewerQuery,
  );

  if (githubError != null) {
    // eslint-disable-next-line no-console
    console.error('Github error');
    // eslint-disable-next-line no-console
    console.error(githubError);
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

  const [account] = await db
    .select(['userId'])
    .from(Table.GithubAccounts)
    .where({id: githubResult.viewer.id})
    .limit(1);

  const response = await onSuccess({
    db,
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
