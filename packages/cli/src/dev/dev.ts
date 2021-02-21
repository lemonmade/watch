import {readFileSync} from 'fs';
import * as path from 'path';
import type {Socket} from 'net';
import {createServer, RequestListener} from 'http';

import {graphql} from 'graphql';
import {makeExecutableSchema} from 'graphql-tools';
import type {IFieldResolver as FieldResolver} from 'graphql-tools';
import express from 'express';
import {json} from 'body-parser';
import webpack from 'webpack';
import type {Configuration} from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import {createWebSocketServer} from '@watching/webpack-hot-worker/server';
import {DevServerWebpackPlugin} from '@watching/webpack-hot-worker/webpack';

import {loadApp} from '../shared';
import type {App} from '../shared';
import {createWebpackConfiguration as createBaseWebpackConfiguration} from '../webpack-config';

import type {Query as QueryType} from './schema.graphql';

type QueryResolver = {
  [K in keyof QueryType]: FieldResolver<never, never, never, QueryType[K]>;
};

export async function dev() {
  const app = await loadApp();
  const devServer = createDevServer(app);
  await devServer.listen(3000, 'localhost');
}

function createDevServer(app: App) {
  const expressApp = express();

  const schema = makeExecutableSchema({
    typeDefs: readFileSync(path.resolve(__dirname, 'schema.graphql'), {
      encoding: 'utf8',
    }),
    resolvers: {
      Query: {
        app: () => {
          return {
            extensions: app.extensions.map((extension) => {
              return {
                id: `gid://ClipsLocalDevelopment/Extension/${extension.id}`,
                name: extension.configuration.name,
                socketUrl: 'ws://localhost:3000/',
                assets: [
                  {source: `http://localhost:3000/assets/${extension.id}.js`},
                ],
              };
            }),
          };
        },
        version: () => 'unstable',
      } as QueryResolver,
    },
  });

  expressApp.options('/graphql', (_, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.end();
  });

  expressApp.post('/graphql', json(), async (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const {operationName, query, variables} = request.body;

      const result = await graphql(
        schema,
        query,
        {},
        {},
        variables,
        operationName,
      );

      response.json(result);
    } catch (error) {
      response.json({errors: [{message: error.message}]});
    }

    response.end();
  });

  const compiler = webpack(createWebpackConfiguration(app));
  expressApp.use(
    webpackDevMiddleware(compiler as any, {
      headers: {
        'Timing-Allow-Origin': '*',
      },
    }),
  );

  const httpServer = createHttpServer(expressApp);
  let webSocketServer: ReturnType<typeof createWebSocketServer> | undefined;

  return {
    async listen(port: number, hostname: string) {
      await new Promise<void>((resolve) => {
        httpServer.server.listen(port, hostname, () => {
          resolve();
        });
      });

      webSocketServer = createWebSocketServer({
        compiler,
        server: httpServer.server,
      });
    },
    async close() {
      await webSocketServer?.close();
      await httpServer.close();
    },
  };

  function createHttpServer(listener?: RequestListener) {
    const server = createServer(listener);
    server.on('error', (error) => {
      throw error;
    });

    const sockets = new Set<Socket>();

    server.on('connection', (socket) => {
      sockets.add(socket);
      socket.once('close', () => {
        sockets.delete(socket);
      });
    });

    return {
      server,
      close() {
        const serverClosePromise = new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });

        for (const socket of sockets) {
          socket.destroy();
        }

        sockets.clear();

        return serverClosePromise;
      },
    };
  }
}

function createWebpackConfiguration(app: App): Configuration {
  const baseConfig = createBaseWebpackConfiguration({
    mode: 'development',
  });

  const entry = Object.fromEntries(
    app.extensions.map((extension) => [
      extension.id,
      path.join(extension.root, 'index'),
    ]),
  );

  return {
    ...baseConfig,
    entry,
    output: {
      publicPath: 'http://localhost:3000/assets/',
    },
    plugins: [...(baseConfig.plugins ?? []), new DevServerWebpackPlugin()],
  };
}
