import '@quilted/polyfills/fetch.node';

import {homedir} from 'os';
import * as path from 'path';
import {writeFile, mkdir, rm as remove, readFile} from 'fs/promises';
import open from 'open';

import type {GraphQL} from '@quilted/graphql';
import {createGraphQL, createHttpFetch} from '@quilted/graphql';

import {PrintableError} from '../../ui';
import type {Ui} from '../../ui';
import {findPortAndListen, makeStoppableServer} from '../http';
import {watchUrl} from '../url';

import checkAuthFromCliQuery from './graphql/CheckAuthFromCliQuery.graphql';
import deleteAccessTokenForCliMutation from './graphql/DeleteAccessTokenForCliMutation.graphql';

export type {GraphQL};

export interface User {
  readonly id: string;
  readonly email: string;
  readonly accessToken: string;
  readonly graphql: GraphQL;
}

const USER_CACHE_DIRECTORY = path.resolve(homedir(), '.watch');
const CREDENTIALS_FILE = path.resolve(USER_CACHE_DIRECTORY, 'credentials');

export async function authenticate({ui}: {ui: Ui}): Promise<User> {
  if (process.env.WATCH_ACCESS_TOKEN) {
    const userFromEnvironmentAccessToken = await userFromAccessToken(
      process.env.WATCH_ACCESS_TOKEN,
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

  const alreadyAuthenticatedUser = await userFromLocalAuthentication();

  if (alreadyAuthenticatedUser) return alreadyAuthenticatedUser;

  const user = await userFromAccessToken(
    await getAccessTokenFromWebAuthentication({ui}),
  );

  if (user == null) {
    throw new PrintableError(
      `Something went wrong while trying to authenticate you. Please try this command again, and sorry for the inconvenience!`,
    );
  }

  const {graphql, ...serializableUser} = user;

  await mkdir(USER_CACHE_DIRECTORY);
  await writeFile(CREDENTIALS_FILE, JSON.stringify(serializableUser));

  return user;
}

export async function deleteAuthentication() {
  const accessToken = await accessTokenFromCacheDirectory();

  if (accessToken) {
    await graphqlFromAccessToken(accessToken).mutate(
      deleteAccessTokenForCliMutation,
      {
        variables: {token: accessToken},
      },
    );
  }
}

export async function userFromLocalAuthentication() {
  const accessTokenFromRoot = await accessTokenFromCacheDirectory();

  if (accessTokenFromRoot == null) return;

  const userFromRootAccessToken = await userFromAccessToken(
    accessTokenFromRoot,
  );

  if (userFromRootAccessToken == null) {
    await remove(USER_CACHE_DIRECTORY, {recursive: true, force: true});
  } else {
    return userFromRootAccessToken;
  }
}

async function accessTokenFromCacheDirectory(): Promise<string | undefined> {
  try {
    const content = await readFile(CREDENTIALS_FILE, {encoding: 'utf8'});
    return (JSON.parse(content) as User).accessToken;
  } catch {
    return undefined;
  }
}

function graphqlFromAccessToken(accessToken: string) {
  return createGraphQL({
    cache: false,
    fetch: createHttpFetch({
      uri: watchUrl('/api/graphql'),
      headers: {
        'X-Access-Token': accessToken,
      },
    }),
  });
}

async function userFromAccessToken(
  accessToken: string,
): Promise<User | undefined> {
  const graphql = graphqlFromAccessToken(accessToken);

  const {data} = await graphql.query(checkAuthFromCliQuery);

  return data?.my == null
    ? undefined
    : {graphql, id: data.my.id, email: data.my.email, accessToken};
}

async function getAccessTokenFromWebAuthentication({ui}: {ui: Ui}) {
  let resolve!: (value: string) => void;
  let reject!: (value?: any) => void;

  const promise = new Promise<string>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  const [{createHttpHandler, noContent}, {createHttpServer}] =
    await Promise.all([
      import('@quilted/http-handlers'),
      import('@quilted/http-handlers/node'),
    ]);

  const handler = createHttpHandler();

  handler.options('/', () =>
    noContent({
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    }),
  );

  handler.post('/', (request) => {
    const {token} = JSON.parse(request.body ?? '{}');

    setTimeout(async () => {
      await stopListening();

      if (token) {
        resolve(token);
      } else {
        reject();
      }
    }, 0);

    return noContent({headers: {'Access-Control-Allow-Origin': '*'}});
  });

  const server = createHttpServer(handler);
  const stopListening = makeStoppableServer(server);

  const port = await findPortAndListen(server, 3211);

  const url = watchUrl(
    `/app/developer/cli/authenticate?redirect=http://localhost:${port}`,
  );

  ui.TextBlock(
    `We need to authenticate you in the Watch web app. We’ll try to open it in a second, or you can manually authenticate by visiting ${ui.Link(
      url,
    )}.`,
  );

  await open(url);

  const token = await promise;

  return token;
}
