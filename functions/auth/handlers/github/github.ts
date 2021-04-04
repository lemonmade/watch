import crypto from 'crypto';
import type {
  ExtendedRequest,
  CookieDefinition,
  ExtendedResponse,
} from '@lemon/tiny-server';
import {createGraphQL, createHttpFetch} from '@quilted/graphql';
import {redirect, fetchJson} from '@lemon/tiny-server';

import {addAuthenticationCookies} from 'shared/utilities/auth';
import {createDatabaseConnection, Table} from 'shared/utilities/database';

import viewerQuery from './graphql/GithubViewerQuery.graphql';

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

enum SearchParam {
  RedirectTo = 'redirect',
}

enum GithubSearchParam {
  Scope = 'scope',
  State = 'state',
  ClientId = 'client_id',
  Redirect = 'redirect_uri',
}

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

export async function handleGithubOAuthCallback(
  request: ExtendedRequest,
  {signUp = false} = {},
) {
  const {url, cookies} = request;

  const expectedState = cookies.get(Cookie.State);
  const redirectTo = cookies.get(Cookie.RedirectTo);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (expectedState == null || expectedState !== state) {
    const loginUrl = new URL('/login', url);

    if (redirectTo) {
      loginUrl.searchParams.set(SearchParam.RedirectTo, redirectTo);
    }

    return deleteOAuthCookies(redirect(loginUrl));
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
    return deleteOAuthCookies(redirect('/login'));
  }

  const db = createDatabaseConnection();

  const [account] = await db
    .select(['userId'])
    .from(Table.GithubAccounts)
    .where({id: githubResult.viewer.id})
    .limit(1);

  const existingUserId = account?.userId;

  if (signUp) {
    if (existingUserId) {
      // eslint-disable-next-line no-console
      console.log(`Found existing user during sign-up: ${existingUserId}`);

      return addAuthenticationCookies(
        {id: existingUserId},
        deleteOAuthCookies(redirect(redirectTo ?? '/app')),
      );
    }

    const {
      id: githubUserId,
      email,
      url: githubUserUrl,
      login,
      avatarUrl,
    } = githubResult.viewer;

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

    return addAuthenticationCookies(
      {id: updatedUserId},
      deleteOAuthCookies(redirect(redirectTo ?? '/app')),
    );
  }

  if (existingUserId) {
    // eslint-disable-next-line no-console
    console.log(`Found existing user during sign-in: ${existingUserId}`);

    return addAuthenticationCookies(
      {id: existingUserId},
      deleteOAuthCookies(redirect(redirectTo ?? '/app')),
    );
  } else {
    // eslint-disable-next-line no-console
    console.log(`No user found!`);

    return deleteOAuthCookies(redirect('/login'));
  }
}

function deleteOAuthCookies(response: ExtendedResponse) {
  response.cookies.delete(Cookie.State);
  response.cookies.delete(Cookie.RedirectTo);

  return response;
}
