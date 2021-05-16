import '@quilted/polyfills/fetch.node';

import * as path from 'path';
import {stat, readFile} from 'fs/promises';

import {
  createHttpHandler,
  noContent,
  json,
  notFound,
  response,
} from '@quilted/http-handlers';
import type {Request} from '@quilted/http-handlers';
import {createHttpServer} from '@quilted/http-handlers/node';
import {Server as WebSocketServer, OPEN} from 'ws';
import type WebSocket from 'ws';
import * as mime from 'mime';

import {graphql} from 'graphql';
import {makeExecutableSchema} from '@graphql-tools/schema';
import type {IFieldResolver as FieldResolver} from '@graphql-tools/utils';

import {watch as rollupWatch} from 'rollup';

import {PrintableError} from '../../ui';
import type {Ui} from '../../ui';

import {loadLocalApp} from '../../utilities/app';
import type {LocalApp} from '../../utilities/app';

import {findPortAndListen, makeStoppableServer} from '../../utilities/http';
import {createRollupConfiguration} from '../../utilities/rollup';

import schemaTypeDefinitions from './schema.graphql';
import type {Query as QueryType} from './schema.graphql';

type AllowedReturnType<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer U
    ? AllowedReturnType<U>
    : AllowedReturnType<T[K]>;
};

interface Context {
  readonly request: Request;
}

type QueryResolver = {
  [K in keyof QueryType]: FieldResolver<
    never,
    Context,
    Parameters<QueryType[K]>[0],
    AllowedReturnType<ReturnType<QueryType[K]>>
  >;
};

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

  const devServer = createDevServer(app, {ui});

  try {
    const result = await devServer.listen();

    ui.Heading('success!', {style: (content, style) => style.green(content)});
    ui.TextBlock(
      `Development server listening on ${ui.Link(
        `http://localhost:${result.port}`,
      )}`,
    );
  } catch (error) {
    throw new PrintableError(
      `There was a problem while trying to start your development server...`,
      {original: error},
    );
  }
}

function createDevServer(app: LocalApp, {ui}: {ui: Ui}) {
  const handler = createHttpHandler();
  const outputRoot = path.resolve(app.root, '.watch/develop');

  const schema = makeExecutableSchema({
    typeDefs: schemaTypeDefinitions,
    resolvers: {
      Query: {
        app: (_, __, {request}) => {
          return {
            extensions: app.extensions.map((extension) => {
              const assetUrl = new URL(
                `/assets/${extension.id}.js`,
                request.url,
              );

              const socketUrl = new URL(
                extension.id,
                `ws://${request.url.host}`,
              );

              return {
                id: `gid://ClipsLocalDevelopment/Extension/${extension.id}`,
                name: extension.configuration.name,
                socketUrl: socketUrl.href,
                assets: [{source: assetUrl.href}],
              };
            }),
          };
        },
        version: () => 'unstable',
      } as QueryResolver,
    },
  });

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
      const {operationName, query, variables} = JSON.parse(
        request.body ?? '{}',
      );

      const result = await graphql(
        schema,
        query,
        {},
        {request},
        variables,
        operationName,
      );

      return json(result, {headers: {'Timing-Allow-Origin': '*'}});
    } catch (error) {
      return json(
        {errors: [{message: error.message}]},
        {headers: {'Timing-Allow-Origin': '*'}},
      );
    }
  });

  handler.get(/^[/]assets/, async (request) => {
    const assetPath = path.join(
      outputRoot,
      request.url.pathname.replace('/assets/', ''),
    );
    const assetStats = await stat(assetPath);

    if (assetStats.isFile()) {
      return response(await readFile(assetPath, {encoding: 'utf8'}), {
        headers: {
          'Content-Type': mime.getType(assetPath)!,
        },
      });
    } else {
      return notFound();
    }
  });

  const httpServer = createHttpServer(handler);
  const stopListening = makeStoppableServer(httpServer);
  let webSocketServer: WebSocketServer | undefined;

  const socketsByExtension = new Map<string, Set<WebSocket>>();
  const buildStateByExtension = new Map<string, BuildState>();

  for (const extension of app.extensions) {
    const baseConfiguration = createRollupConfiguration(extension);

    const watcher = rollupWatch({
      ...baseConfiguration,
      output: {
        dir: path.resolve(app.root, '.watch/develop'),
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

      webSocketServer = new WebSocketServer({server: httpServer});

      webSocketServer.on('connection', (socket, request) => {
        const extensionId = request.url!.slice(1);
        const buildState = buildStateByExtension.get(extensionId);

        if (buildState == null) {
          socket.send(JSON.stringify({type: 'not-found'}));
          socket.close();
          return;
        }

        const sockets = socketsByExtension.get(extensionId) ?? new Set();
        sockets.add(socket);
        socketsByExtension.set(extensionId, sockets);

        socket.on('close', () => {
          sockets.delete(socket);
        });

        socket.send(JSON.stringify({type: 'build', data: buildState}));
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
      if (socket.readyState !== OPEN) continue;
      socket.send(JSON.stringify({type: 'build', data: state}));
    }
  }
}
