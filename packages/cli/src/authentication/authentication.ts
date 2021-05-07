import stripAnsi from 'strip-ansi';
import {magenta, underline, red, bold} from 'colorette';

import type {GraphQL} from '@quilted/graphql';
import {createGraphQL, createHttpFetch} from '@quilted/graphql';

import checkAuthFromCliQuery from './graphql/CheckAuthFromCliQuery.graphql';

export type {GraphQL};

export async function authenticate() {
  let graphql: GraphQL | undefined;

  if (process.env.WATCH_ACCESS_TOKEN) {
    graphql = await graphqlIfAuthenticated(process.env.WATCH_ACCESS_TOKEN);

    if (graphql == null) {
      console.log();
      console.log(
        bold(
          red(
            `\u2015\u2015\u2015 error! ${'\u2015'.repeat(
              Math.max(
                0,
                (process.stdout.columns ?? 25) - 3 - ' error! '.length - 5,
              ),
            )}`,
          ),
        ),
      );

      console.log(
        prettyFormat(
          `We tried to use the access token you provided in the ${bold(
            'WATCH_ACCESS_TOKEN',
          )} environment variable, but it didn’t work. Your access token might have been deleted, or you may have typed it incorrectly. If you need a new access token, you can generate one at ${printWatchUrl(
            '/app/developer/access-tokens',
          )}, or you can remove the environment variable follow the interactive authentication flow.`,
        ),
      );

      return undefined;
    } else {
      return {graphql};
    }
  }

  const accessTokenFromRoot = undefined;

  if (accessTokenFromRoot) {
    graphql = await graphqlIfAuthenticated(accessTokenFromRoot);
    if (graphql) return {graphql};
  }

  graphql = await graphqlIfAuthenticated(
    await getAccessTokenFromWebAuthentication(),
  );

  if (graphql == null) {
    return undefined;
  }

  return {graphql};
}

function prettyFormat(content: string) {
  const columns = process.stdout.columns ?? 60;

  return content
    .split('\n')
    .map((paragraph) => {
      let buffer = '';
      const words = paragraph.split(' ');

      let currentColumn = 0;

      for (const word of words) {
        const length = stripAnsi(word).length;

        if (buffer === '') {
          buffer = word;
          currentColumn = length;
          continue;
        }

        const newColumn = currentColumn + 1 + length;

        if (currentColumn >= 0.5 * columns && newColumn > columns) {
          buffer += `\n${word}`;
          currentColumn = length;
        } else {
          buffer += ` ${word}`;
          currentColumn = newColumn % columns;
        }
      }

      return buffer;
    })
    .join('\n');
}

async function graphqlIfAuthenticated(accessToken: string) {
  const graphql = createGraphQL({
    cache: false,
    fetch: createHttpFetch({
      uri: watchUrl('/api/graphql'),
      headers: {
        'X-Watch-Access-Token': accessToken,
      },
    }),
  });

  const {data} = await graphql.query(checkAuthFromCliQuery);

  return data?.me == null ? undefined : graphql;
}

async function getAccessTokenFromWebAuthentication() {
  let resolve!: (value: string) => void;
  let reject!: (value?: any) => void;

  // eslint-disable-next-line promise/param-names
  const promise = new Promise<string>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  const [
    {createHttpHandler, noContent},
    {createHttpServer},
  ] = await Promise.all([
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

  const port = await new Promise<number>((resolve, reject) => {
    let port = 3211;

    function handleError(error: Error & {code?: string}) {
      if (error.code === 'EADDRINUSE') {
        port += 1;
        server.listen(port, handleListen);
      } else {
        server.off('error', handleError);
        reject(error);
      }
    }

    function handleListen() {
      server.off('error', handleError);
      resolve(port);
    }

    server.on('error', handleError);
    server.listen(port, handleListen);
  });

  console.log(
    `We need to authenticate you in the Watch web app. We’ll open it in a second, or you can manually authenticate by visiting ${printWatchUrl(
      `/app/developer/cli/authenticate?redirect=http://localhost:${port}`,
    )}`,
  );

  const token = await promise;

  return token;
}

function printWatchUrl(path: string) {
  return underline(magenta(watchUrl(path)));
}

// Adapted from https://github.com/gajus/http-terminator/blob/master/src/factories/createInternalHttpTerminator.ts
function makeStoppableServer(server: import('net').Server) {
  let stopping = false;

  const sockets = new Set<import('net').Socket>();

  server.on('connection', (socket) => {
    if (stopping) {
      socket.destroy();
      return;
    }

    sockets.add(socket);
    socket.once('destroy', () => sockets.delete(socket));
  });

  return () => {
    stopping = true;

    server.on('request', (_, outgoingMessage) => {
      if (!outgoingMessage.headersSent) {
        outgoingMessage.setHeader('connection', 'close');
      }
    });

    for (const socket of sockets) {
      // @ts-expect-error
      const serverResponse = socket._httpMessage;

      if (serverResponse) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader('connection', 'close');
        }

        continue;
      }

      socket.destroy();
    }

    return new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  };
}

function watchUrl(path: string) {
  return new URL(
    path,
    process.env.WATCH_ROOT_URL ?? 'https://watch.lemon.tools',
  ).href;
}
