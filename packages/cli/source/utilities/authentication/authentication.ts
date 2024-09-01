import '@quilted/polyfills/fetch';

import {homedir} from 'os';
import * as path from 'path';
import {writeFile, mkdir, rm as remove, readFile} from 'fs/promises';
import open from 'open';

import {
  createGraphQLFetch,
  type GraphQLFetch,
  type GraphQLFetchContext,
} from '@quilted/graphql';

import {PrintableError} from '../../ui';
import type {Ui} from '../../ui';
import {findPortAndListen, makeStoppableServer} from '../http';
import {watchUrl} from '../url';

import checkAuthFromCliQuery from './graphql/CheckAuthFromCliQuery.graphql';
import deleteAccessTokenForCliMutation from './graphql/DeleteAccessTokenForCliMutation.graphql';

export type {GraphQLFetch};

export interface User {
  readonly id: string;
  readonly email: string;
  readonly accessToken: string;
  readonly graphql: GraphQLFetch;
}

const USER_CACHE_DIRECTORY = path.resolve(homedir(), '.watch');
const CREDENTIALS_FILE = path.resolve(USER_CACHE_DIRECTORY, 'credentials');

export async function authenticate({
  ui,
  debug,
}: {
  ui: Ui;
  debug?: boolean;
}): Promise<User> {
  if (process.env.WATCH_ACCESS_TOKEN) {
    const userFromEnvironmentAccessToken = await userFromAccessToken(
      process.env.WATCH_ACCESS_TOKEN,
      {ui, debug},
    );

    if (userFromEnvironmentAccessToken == null) {
      throw new PrintableError(
        (ui) =>
          `We tried to use the access token you provided in the ${ui.Code(
            'WATCH_ACCESS_TOKEN',
          )} environment variable, but it didn’t work. Your access token might have been deleted, or you may have typed it incorrectly. If you need a new access token, you can generate one at ${ui.Link(
            watchUrl('/app/developer/access-tokens'),
          )}, or you can remove the environment variable follow the interactive authentication flow.`,
      );
    } else {
      return userFromEnvironmentAccessToken;
    }
  }

  const alreadyAuthenticatedUser = await userFromLocalAuthentication({
    ui,
    debug,
  });

  if (alreadyAuthenticatedUser) return alreadyAuthenticatedUser;

  const user = await authenticateFromWebAuthentication({ui, debug});

  return user;
}

export async function deleteAuthentication({
  ui,
  debug,
}: {
  ui: Ui;
  debug?: boolean;
}) {
  const accessToken = await accessTokenFromCacheDirectory();

  if (accessToken) {
    const mutate = graphqlFromAccessToken(accessToken, {ui, debug});
    await mutate(deleteAccessTokenForCliMutation, {
      variables: {token: accessToken},
    });

    await remove(USER_CACHE_DIRECTORY, {recursive: true, force: true});
  }
}

export async function userFromLocalAuthentication({
  ui,
  debug,
}: {
  ui: Ui;
  debug?: boolean;
}) {
  const accessTokenFromRoot = await accessTokenFromCacheDirectory();

  if (accessTokenFromRoot == null) return;

  const userFromRootAccessToken = await userFromAccessToken(
    accessTokenFromRoot,
    {ui, debug},
  );

  if (userFromRootAccessToken == null) {
    await remove(USER_CACHE_DIRECTORY, {recursive: true, force: true});
  } else {
    return userFromRootAccessToken;
  }
}

export async function hasLocalAuthentication() {
  return (await accessTokenFromCacheDirectory()) != null;
}

async function accessTokenFromCacheDirectory(): Promise<string | undefined> {
  try {
    const content = await readFile(CREDENTIALS_FILE, {encoding: 'utf8'});
    return (JSON.parse(content) as User).accessToken;
  } catch {
    return undefined;
  }
}

function graphqlFromAccessToken(
  accessToken: string,
  {ui, debug = false}: {ui: Ui; debug?: boolean},
) {
  const baseFetchGraphQL = createGraphQLFetch({
    url: watchUrl('/api/graphql'),
    headers: {
      'X-Access-Token': accessToken,
    },
  });

  if (!debug) return baseFetchGraphQL;

  return async function fetchGraphQL(query, options) {
    const context: GraphQLFetchContext = {};

    ui.TextBlock(`[debug] Performing GraphQL query: ${(query as any).name}`, {
      style: (content, style) => style.dim(content),
    });
    ui.TextBlock((query as any).source, {
      style: (content, style) => style.dim(content),
    });
    ui.TextBlock(`Variables: ${JSON.stringify(options?.variables ?? {})}`, {
      style: (content, style) => style.dim(content),
    });

    const result = await baseFetchGraphQL(query, options, context);

    if (context.request) {
      ui.TextBlock(
        `[debug] Performed GraphQL request: ${context.request.method.toUpperCase()} ${
          context.request.url
        }`,
        {
          style: (content, style) => style.dim(content),
        },
      );
    }

    ui.TextBlock(
      `[debug] GraphQL response: ${(query as any).name} (status: ${
        context.response?.status ?? 'unknown'
      })`,
      {
        style: (content, style) => style.dim(content),
      },
    );
    ui.TextBlock(JSON.stringify(result), {
      style: (content, style) => style.dim(content),
    });

    return result;
  } satisfies GraphQLFetch;
}

async function userFromAccessToken(
  accessToken: string,
  {ui, debug = false}: {ui: Ui; debug?: boolean},
): Promise<User | undefined> {
  const graphql = graphqlFromAccessToken(accessToken, {ui, debug});

  const {data} = await graphql(checkAuthFromCliQuery);

  return data?.my == null
    ? undefined
    : {graphql, id: data.my.id, email: data.my.email, accessToken};
}

export async function authenticateFromWebAuthentication({
  ui,
  to = '/app/developer/cli/authenticate',
  debug = false,
  ...rest
}: Omit<PerformWebAuthenticationOptions, 'to'> & {
  ui: Ui;
  to?: PerformWebAuthenticationOptions['to'];
  debug?: boolean;
}) {
  const {token} = await performWebAuthentication<{token: string}>({
    ui,
    to,
    ...rest,
  });

  const user = await userFromAccessToken(token, {ui, debug});

  if (user == null) {
    throw new PrintableError(
      `Something went wrong while trying to authenticate you. Please try this command again, and sorry for the inconvenience!`,
    );
  }

  const {graphql, ...serializableUser} = user;

  await mkdir(USER_CACHE_DIRECTORY, {recursive: true});
  await writeFile(CREDENTIALS_FILE, JSON.stringify(serializableUser));

  return user;
}

function watchUrlWithCliConnection(path: string, localServerUrl: string) {
  const url = watchUrl(path);
  url.searchParams.set('connect', localServerUrl);
  return url;
}

interface PerformWebAuthenticationOptions {
  ui: Ui;
  to:
    | string
    | URL
    | ((details: {
        localServerUrl: string;
        urlWithConnect(path: string): URL;
      }) => string | URL);
}

async function performWebAuthentication<Result = unknown>({
  ui,
  to,
}: PerformWebAuthenticationOptions) {
  let resolve!: (value: Result) => void;
  let reject!: (value?: any) => void;

  const promise = new Promise<Result>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  const [{RequestRouter, JSONResponse, NoContentResponse}, {createHttpServer}] =
    await Promise.all([
      import('@quilted/request-router'),
      import('@quilted/request-router/node'),
    ]);

  const router = new RequestRouter();

  router.options(
    '/',
    () =>
      new NoContentResponse({
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }),
  );

  router.post('/', async (request) => {
    const result = await request.json();

    setTimeout(async () => {
      await stopListening();

      if (result) {
        resolve(result);
      } else {
        reject();
      }
    }, 0);

    return new JSONResponse(
      {},
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      },
    );
  });

  const server = createHttpServer(router);
  const stopListening = makeStoppableServer(server);

  const port = await findPortAndListen(server, 3211);
  const localServerUrl = `http://localhost:${port}`;

  let url: URL;

  if (typeof to === 'function') {
    url = watchUrl(
      to({
        localServerUrl,
        urlWithConnect: (path) =>
          watchUrlWithCliConnection(path, localServerUrl),
      }).toString(),
    );
  } else {
    url = watchUrlWithCliConnection(to.toString(), localServerUrl);
  }

  ui.TextBlock(
    `We need to authenticate you in the Watch web app. We’ll try to open it in a second, or you can manually authenticate by visiting ${ui.Link(
      url,
    )}.`,
  );

  await open(url.href);

  const token = await promise;

  return token;
}
