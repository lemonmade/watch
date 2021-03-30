import {createGraphQL, createHttpFetch} from '@quilted/graphql';
import {createApp, redirect, fetchJson, html} from '@lemon/tiny-server';
import type {CookieDefinition, ExtendedResponse} from '@lemon/tiny-server';

import viewerQuery from './graphql/GithubViewerQuery.graphql';

const CLIENT_ID = '60c6903025bfd274db53';
const SCOPES = 'user';

const DEFAULT_COOKIE_OPTIONS: Omit<CookieDefinition, 'value'> = {
  path: '/me/oauth/github',
  maxAge: 60 * 60,
  sameSite: 'lax',
  secure: true,
  httpOnly: true,
};

enum Cookie {
  State = 'state',
  RedirectTo = 'redirectTo',
}

enum SearchParam {
  Redirect = 'redirect',
}

enum GithubSearchParam {
  Scope = 'scope',
  State = 'state',
  ClientId = 'client_id',
}

const app = createApp({prefix: '/me/oauth/github'});

app.get('/', () => {
  return html(
    `
    <html>
      <body>
        <a href="/me/oauth/github/start">Auth with github</a>
      </body>
    </html>
  `,
    {
      headers: {'Cache-Control': 'no-cache'},
    },
  );
});

app.get('/start', (request) => {
  const state = '123';
  const redirectTo = request.url.searchParams.get(SearchParam.Redirect);

  const githubOAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubOAuthUrl.searchParams.set(GithubSearchParam.ClientId, CLIENT_ID);
  githubOAuthUrl.searchParams.set(GithubSearchParam.Scope, SCOPES);
  githubOAuthUrl.searchParams.set(GithubSearchParam.State, state);

  const response = redirect(githubOAuthUrl);

  response.cookies.set(Cookie.State, state, DEFAULT_COOKIE_OPTIONS);

  if (redirectTo) {
    response.cookies.set(Cookie.RedirectTo, redirectTo, DEFAULT_COOKIE_OPTIONS);
  }

  return response;
});

app.get('/callback', async (request) => {
  const {url, cookies} = request;

  const expectedState = cookies.get(Cookie.State);
  const redirectTo = cookies.get(Cookie.RedirectTo);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (expectedState == null || expectedState !== state) {
    // const loginUrl = new URL('/login');

    // if (redirectTo) {
    //   loginUrl.searchParams.set(SearchParam.Redirect, redirectTo);
    // }

    return deleteCookies(redirect('/me/oauth/github'));
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
        Authorization: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }),
  });

  const {data: githubResult} = await githubClient.query(viewerQuery);

  // eslint-disable-next-line no-console
  console.log(githubResult);

  return deleteCookies(redirect(redirectTo ?? '/'));
});

export default app;

function deleteCookies(response: ExtendedResponse) {
  response.cookies.delete(Cookie.State);
  response.cookies.delete(Cookie.RedirectTo);

  return response;
}
