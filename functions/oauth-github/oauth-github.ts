/* eslint no-console: off */

import crypto from 'crypto';
import {createGraphQL, createHttpFetch} from '@quilted/graphql';
import {createApp, redirect, fetchJson} from '@lemon/tiny-server';
import type {CookieDefinition, ExtendedResponse} from '@lemon/tiny-server';

import {sign} from 'shared/utilities/auth';
import {createDatabaseConnection, Table} from 'shared/utilities/database';

import viewerQuery from './graphql/GithubViewerQuery.graphql';

const ROOT_PATH = '/internal/auth/github';
const CLIENT_ID = '60c6903025bfd274db53';
const SCOPES = 'read:user';

const DEFAULT_COOKIE_OPTIONS: Omit<CookieDefinition, 'value'> = {
  path: ROOT_PATH,
  maxAge: 60 * 60,
  sameSite: 'lax',
  secure: true,
  httpOnly: true,
};

enum Cookie {
  Auth = 'auth',
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

const app = createApp({prefix: ROOT_PATH});

app.get(/^[/]sign-(in|up)$/, (request) => {
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
});

app.get(/^[/]sign-(in|up)[/]callback$/, async (request) => {
  const {url, cookies} = request;

  const signUp = request.url.normalizedPath.startsWith('/sign-up');

  const expectedState = cookies.get(Cookie.State);
  const redirectTo = cookies.get(Cookie.RedirectTo);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (expectedState == null || expectedState !== state) {
    const loginUrl = new URL('/login', url);

    if (redirectTo) {
      loginUrl.searchParams.set(SearchParam.RedirectTo, redirectTo);
    }

    return deleteCookies(redirect(loginUrl));
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

  const {data: githubResult} = await githubClient.query(viewerQuery);

  if (githubResult == null) {
    // Need better error handling
    console.log('No result fetched from GitHub!');
    return deleteCookies(redirect('/login'));
  }

  const db = createDatabaseConnection();

  console.log(githubResult);

  const [{userId}] = await db
    .select('userId')
    .from(Table.GithubAccounts)
    .where({id: githubResult.viewer.id})
    .limit(1);

  if (signUp) {
    if (userId) {
      console.log(`Found existing user during sign-up: ${userId}`);

      const token = sign({id: userId});
      const response = deleteCookies(redirect(redirectTo ?? '/app'));
      response.cookies.set(Cookie.Auth, token, {
        ...DEFAULT_COOKIE_OPTIONS,
        path: '/',
      });
      return response;
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

      await trx.insert({
        id: githubUserId,
        userId,
        login,
        profileUrl: githubUserUrl,
        avatarUrl,
      });

      return userId;
    });

    console.log(`Created new user during sign-up: ${updatedUserId}`);

    const token = sign({id: updatedUserId});
    const response = deleteCookies(redirect(redirectTo ?? '/app'));
    response.cookies.set(Cookie.Auth, token, {
      ...DEFAULT_COOKIE_OPTIONS,
      path: '/',
    });
    return response;
  }

  if (userId) {
    console.log(`Found existing user during sign-in: ${userId}`);

    const token = sign({id: userId});
    const response = deleteCookies(redirect(redirectTo ?? '/app'));
    response.cookies.set(Cookie.Auth, token, {
      ...DEFAULT_COOKIE_OPTIONS,
      path: '/',
    });

    return response;
  } else {
    // Need better error handling
    console.log(`No user, oh no!`);

    return deleteCookies(redirect('/login'));
  }
});

app.get((request) => {
  const loginUrl = new URL('/login', request.url);
  const redirectTo = request.url.searchParams.get(SearchParam.RedirectTo);

  if (redirectTo) {
    loginUrl.searchParams.set(SearchParam.RedirectTo, redirectTo);
  }

  return deleteCookies(redirect(loginUrl));
});

export default app;

function deleteCookies(response: ExtendedResponse) {
  response.cookies.delete(Cookie.State);
  response.cookies.delete(Cookie.RedirectTo);

  return response;
}
