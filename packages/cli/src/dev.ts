import * as path from 'path';
import type {Socket} from 'net';
import {createServer, RequestListener} from 'http';

import express from 'express';
import webpack from 'webpack';
import type {Configuration} from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import {createWebSocketServer} from '@watching/webpack-hot-worker/server';
import {DevServerWebpackPlugin} from '@watching/webpack-hot-worker/webpack';

import {loadApp} from './shared';
import type {App} from './shared';
import {createWebpackConfiguration as createBaseWebpackConfiguration} from './webpack-config';

export async function dev() {
  const app = await loadApp();
  const devServer = createDevServer(app);
  await devServer.listen(3000, 'localhost');
}

function createDevServer(app: App) {
  const expressApp = express();

  expressApp.use((request, response, next) => {
    if (request.path !== '/manifest') {
      next();
      return;
    }

    response.json({app});
    response.end();
  });

  const compiler = webpack(createWebpackConfiguration(app));
  expressApp.use(webpackDevMiddleware(compiler as any));

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
