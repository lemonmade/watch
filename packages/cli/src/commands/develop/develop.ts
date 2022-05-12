import '@quilted/polyfills/fetch';

import * as path from 'path';
import {stat, readFile} from 'fs/promises';
import {on} from '@lemonmade/events';
import {createThread} from '@lemonmade/threads';

import {
  createHttpHandler,
  noContent,
  json,
  notFound,
  response,
} from '@quilted/http-handlers';
import {createHttpServer} from '@quilted/http-handlers/node';

import WebSocket from 'ws';
import mime from 'mime';
import open from 'open';

import {parse} from 'graphql';

import {watch as rollupWatch} from 'rollup';

import {PrintableError} from '../../ui';
import type {Ui} from '../../ui';

import {watchUrl} from '../../utilities/url';
import {
  rootOutputDirectory,
  ensureRootOutputDirectory,
} from '../../utilities/build';

import {loadLocalApp} from '../../utilities/app';
import type {LocalApp} from '../../utilities/app';

import {findPortAndListen, makeStoppableServer} from '../../utilities/http';
import {createRollupConfiguration} from '../../utilities/rollup';

import {execute, createQueryResolver} from './graphql';

export type BuildState =
  | {status: 'success'; startedAt: number; duration: number; errors?: never}
  | {
      status: 'error';
      startedAt: number;
      duration: number;
      errors: {message: string; stack?: string}[];
    }
  | {status: 'building'; startedAt: number; duration?: never; errors?: never};

export interface WebSocketEventMap {
  connect: BuildState;
  start: never;
  close: never;
  'not-found': never;
}

export async function develop({ui}: {ui: Ui}) {
  const app = await loadLocalApp();

  if (app.extensions.length === 0) {
    ui.Heading('heads up!', {style: (content, style) => style.yellow(content)});
    ui.TextBlock(
      `Your app doesn’t have any extensions to push yet. Run ${ui.Code(
        'watchapp create extension',
      )} to get started!`,
    );

    process.exitCode = 1;

    return;
  }

  await ensureRootOutputDirectory(app);
  const devServer = createDevServer(app, {ui});

  try {
    const result = await devServer.listen();

    const localUrl = new URL(`http://localhost:${result.port}`);
    const localSocketUrl = new URL(`ws://localhost:${result.port}`);

    const targetUrl = watchUrl(`/app`);
    targetUrl.searchParams.set(
      'connect',
      new URL('/connect', localSocketUrl).href,
    );

    ui.Heading('success!', {style: (content, style) => style.green(content)});
    ui.TextBlock(
      `We’ve started a development server at ${ui.Link(
        localUrl,
      )}. In a moment, we’ll open ${ui.Link(
        targetUrl,
      )}, which will connect your local environment to the Watch app. All of the extensions in your local workspace will be automatically installed in all their supported extension points, so navigate to the page you are extending to see your extensions in action. Have fun building!`,
    );

    await open(targetUrl.href);
  } catch (error) {
    throw new PrintableError(
      `There was a problem while trying to start your development server...`,
      {original: error as any},
    );
  }
}

function createDevServer(app: LocalApp, {ui}: {ui: Ui}) {
  const handler = createHttpHandler();
  const outputRoot = path.resolve(rootOutputDirectory(app), 'develop');

  const resolver = createQueryResolver(app);

  handler.get('/', () =>
    json(app, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      },
    }),
  );

  handler.options('/graphql', () =>
    noContent({
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }),
  );

  handler.post('/graphql', async (request) => {
    try {
      const {query, variables} = JSON.parse(request.body ?? '{}');

      const result = await execute(query, resolver, {
        variables,
        context: {rootUrl: new URL('/', request.url)},
      }).untilResolved();

      return json(result, {
        headers: {
          'Timing-Allow-Origin': '*',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } catch (error) {
      return json(
        {errors: [{message: (error as any).message}]},
        {
          headers: {
            'Timing-Allow-Origin': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        },
      );
    }
  });

  handler.get(
    '/assets',
    async (request) => {
      const assetPath = path.join(
        outputRoot,
        request.url.pathname.replace('/assets/', ''),
      );

      try {
        const assetStats = await stat(assetPath);

        if (assetStats.isFile()) {
          return response(await readFile(assetPath, {encoding: 'utf8'}), {
            headers: {
              'Timing-Allow-Origin': '*',
              'Content-Type': mime.getType(assetPath)!,
            },
          });
        } else {
          return notFound();
        }
      } catch {
        return notFound();
      }
    },
    {exact: false},
  );

  const httpServer = createHttpServer(handler);
  const stopListening = makeStoppableServer(httpServer);
  let webSocketServer: WebSocket.Server | undefined;

  const socketsByExtension = new Map<string, Set<WebSocket>>();
  const buildStateByExtension = new Map<string, BuildState>();

  for (const extension of app.extensions) {
    const baseConfiguration = createRollupConfiguration(extension, {
      mode: 'development',
    });

    const watcher = rollupWatch({
      ...baseConfiguration,
      output: {
        format: 'iife',
        dir: path.join(outputRoot, 'extensions'),
        entryFileNames: `${extension.id}.js`,
      },
    });

    watcher.on('event', (event) => {
      switch (event.code) {
        case 'BUNDLE_START': {
          updateBuildState(extension.id, {
            status: 'building',
            startedAt: Date.now(),
          });

          break;
        }
        case 'BUNDLE_END': {
          const existingState = buildStateByExtension.get(extension.id);
          const {duration} = event;

          updateBuildState(extension.id, {
            status: 'success',
            duration,
            startedAt: existingState?.startedAt ?? Date.now() - duration,
          });

          break;
        }
        case 'ERROR': {
          const existingState = buildStateByExtension.get(extension.id);
          const startedAt = existingState?.startedAt ?? Date.now();
          const {error} = event;

          updateBuildState(extension.id, {
            status: 'error',
            duration: Date.now() - startedAt,
            startedAt,
            errors: [{message: error.message, stack: error.stack}],
          });

          new PrintableError(
            `There was an error while trying to build your extension:`,
            {original: error},
          ).print(ui);

          break;
        }
      }
    });
  }

  return {
    async listen() {
      const port = await findPortAndListen(httpServer);

      webSocketServer = new WebSocket.Server({
        server: httpServer,
        path: '/connect',
      });

      webSocketServer.on('connection', async (socket) => {
        const abort = new AbortController();
        const {signal} = abort;

        const expose = {
          async *query(query: string) {
            yield* execute(parse(query) as any, resolver, {
              signal,
              // TODO: get thr right port, handle proxies, etc
              context: {rootUrl: new URL('http://localhost:3000')},
            });
          },
        };

        const thread = createThread<typeof expose>(
          {
            send(message) {
              socket.send(JSON.stringify(message));
            },
            async *listen({signal}) {
              const messages = on<{message: {data: WebSocket.Data}}>(
                socket,
                'message',
                {signal},
              );

              for await (const {data} of messages) {
                yield JSON.parse(data.toString());
              }
            },
          },
          {expose},
        );

        signal.addEventListener(
          'abort',
          () => {
            thread.terminate();
          },
          {once: true},
        );

        socket.once('close', () => abort.abort());
      });

      return {port};
    },
    async close() {
      webSocketServer?.close();
      await stopListening();
    },
  };

  function updateBuildState(id: string, state: BuildState) {
    buildStateByExtension.set(id, state);

    const sockets = socketsByExtension.get(id);

    if (sockets == null) return;

    for (const socket of sockets) {
      if (socket.readyState !== WebSocket.OPEN) continue;
      socket.send(JSON.stringify({type: 'build', data: state}));
    }
  }
}
