import crypto from 'crypto';
import type {
  ExtendedRequest,
  CookieDefinition,
  ExtendedResponse,
} from '@lemon/tiny-server';
import {createGraphQL, createHttpFetch} from '@quilted/graphql';
import {redirect, fetchJson} from '@lemon/tiny-server';

import {createDatabaseConnection, Table} from 'shared/utilities/database';
import type {Database} from 'shared/utilities/database';

import {
  restartAuth as baseRestartAuth,
  completeAuth as baseCompleteAuth,
} from '../shared';
import {SearchParam} from '../../constants';

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
  RedirectTo = 'redirect',
}

enum GithubSearchParam {
  Scope = 'scope',
  State = 'state',
  ClientId = 'client_id',
  Redirect = 'redirect_uri',
}

const completeAuth: typeof baseCompleteAuth = (userId, options) =>
  deleteOAuthCookies(baseCompleteAuth(userId, options), options);

const restartAuth: typeof baseRestartAuth = (options) =>
  deleteOAuthCookies(baseRestartAuth(options), options);

export function startGithubOAuth(request: ExtendedRequest) {
  const state = crypto
    .randomBytes(15)
    .map((byte) => byte % 10)
    .join('');

  const redirectTo = request.url.searchParams.get(SearchParam.RedirectTo);

  const githubOAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubOAuthUrl.searchParams.set(GithubSearchParam.ClientId, CLIENT_ID);
  githubOAuthUrl.searchParams.set(GithubSearchParam.Scope, SCOPES);
  githubOAuthUrl.searchParams.set(GithubSearchParam.State, state);
  githubOAuthUrl.searchParams.set(
    GithubSearchParam.Redirect,
    new URL('callback', `${request.url.origin}${request.url.pathname}/`).href,
  );

  const response = redirect(githubOAuthUrl, {
    headers: {
      'Cache-Control': 'no-cache',
    },
  });

  const cookieOptions = {
    ...DEFAULT_COOKIE_OPTIONS,
    path: request.url.pathname,
  };

  response.cookies.set(Cookie.State, state, cookieOptions);

  if (redirectTo) {
    response.cookies.set(Cookie.RedirectTo, redirectTo, cookieOptions);
  }

  return response;
}

export function handleGithubOAuthSignIn(request: ExtendedRequest) {
  return handleGithubOAuthCallback(request, ({userId, redirectTo}) => {
    if (userId) {
      // eslint-disable-next-line no-console
      console.log(`Found existing user during sign-in: ${userId}`);

      return completeAuth(userId, {redirectTo, request});
    } else {
      // eslint-disable-next-line no-console
      console.log(`No user found!`);

      return restartAuth({request});
    }
  });
}

export function handleGithubOAuthSignUp(request: ExtendedRequest) {
  return handleGithubOAuthCallback(
    request,
    async ({db, userId: existingUserId, redirectTo, githubUser}) => {
      if (existingUserId) {
        // eslint-disable-next-line no-console
        console.log(`Found existing user during sign-up: ${existingUserId}`);
        return completeAuth(existingUserId, {request, redirectTo});
      }

      const {
        id: githubUserId,
        email,
        url: githubUserUrl,
        login,
        avatarUrl,
      } = githubUser;

      try {
        const updatedUserId = await db.transaction(async (trx) => {
          const [userId] = await trx
            .insert({
              email,
            })
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

        return completeAuth(updatedUserId, {redirectTo, request});
      } catch {
        return restartAuth({redirectTo, request});
      }
    },
  );
}

interface GithubCallbackResult {
  readonly db: Database;
  readonly userId?: string;
  readonly githubUser: GithubViewerQueryData.Viewer;
  readonly redirectTo?: string;
}

const db = createDatabaseConnection();

async function handleGithubOAuthCallback(
  request: ExtendedRequest,
  handleGithubResult: (
    result: GithubCallbackResult,
  ) => ExtendedResponse | Promise<ExtendedResponse>,
) {
  const {url, cookies} = request;

  const expectedState = cookies.get(Cookie.State);
  const redirectTo = cookies.get(Cookie.RedirectTo);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (expectedState == null || expectedState !== state) {
    return restartAuth({request, redirectTo});
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
    return restartAuth({request});
  }

  const [account] = await db
    .select(['userId'])
    .from(Table.GithubAccounts)
    .where({id: githubResult.viewer.id})
    .limit(1);

  const response = await handleGithubResult({
    db,
    userId: account?.userId,
    githubUser: githubResult.viewer,
    redirectTo,
  });

  return response;
}

function deleteOAuthCookies(
  response: ExtendedResponse,
  {request}: {request?: ExtendedRequest},
) {
  if (request == null || request.cookies.has(Cookie.State)) {
    response.cookies.delete(Cookie.State);
  }

  if (request == null || request.cookies.has(Cookie.RedirectTo)) {
    response.cookies.delete(Cookie.RedirectTo);
  }

  return response;
}
