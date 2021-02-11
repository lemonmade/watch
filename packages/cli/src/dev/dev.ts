import * as path from 'path';
import type {Socket} from 'net';
import {createServer, RequestListener, Server} from 'http';

import {Server as WebSocketServer} from 'ws';
import express from 'express';
import webpack from 'webpack';
import type {Configuration} from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';

import {loadApp} from '../shared';
import type {App} from '../shared';
import {createWebpackConfiguration as createBaseWebpackConfiguration} from '../webpack-config';

import type {MessageMap} from './types';
import {DevServerWebpackPlugin} from './DevServerWebpackPlugin';

const WEBSOCKET_HEARTBEAT_INTERVAL = 1_000;

interface KeepAliveCheck {
  isAlive?: boolean;
}

type WebSocket = WebSocketServer['clients'] extends Set<infer T> ? T : never;

export async function dev() {
  const app = await loadApp();
  const devServer = createDevServer(app);
  await devServer.listen(3000, 'localhost');
}

function createDevServer(app: App) {
  let stats: any;
  const webSockets = new Set<WebSocket>();

  const expressApp = express();

  const compiler = webpack(createWebpackConfiguration(app));

  compiler.hooks.compile.tap('ClipsDevServer', () => {
    send(webSockets, 'compile');
  });

  compiler.hooks.invalid.tap('ClipsDevServer', () => {
    send(webSockets, 'compile');
  });

  compiler.hooks.done.tap('ClipsDevServer', (newStats) => {
    stats = newStats.toJson();
    sendStats(webSockets);
  });

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

      webSocketServer = createWebSocketServer(httpServer.server);
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

  function createWebSocketServer(server: Server) {
    const webSocketServer = new WebSocketServer({
      noServer: true,
      path: '/ws',
    });

    server.on('upgrade', (request, socket, head) => {
      if (!webSocketServer.shouldHandle(request)) return;

      webSocketServer.handleUpgrade(request, socket, head, (connection) => {
        webSocketServer.emit('connection', connection, request);
      });
    });

    webSocketServer.on('connection', (socket) => {
      const aliveSocket = (socket as any) as typeof socket & KeepAliveCheck;

      aliveSocket.isAlive = true;

      aliveSocket.on('pong', () => {
        aliveSocket.isAlive = true;
      });

      webSockets.add(aliveSocket);
      aliveSocket.on('close', () => {
        webSockets.delete(aliveSocket);
      });

      if (stats) sendStats([aliveSocket], {force: true});
    });

    const heartbeatInterval = setInterval(() => {
      webSocketServer.clients.forEach((socket) => {
        const aliveSocket = (socket as any) as typeof socket & KeepAliveCheck;

        if (aliveSocket.isAlive === false) {
          aliveSocket.terminate();
          return;
        }

        aliveSocket.isAlive = false;
        aliveSocket.ping(() => {});
      });
    }, WEBSOCKET_HEARTBEAT_INTERVAL);

    return {
      server: webSocketServer,
      close() {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }

        const serverClosePromise = new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });

        for (const webSocket of webSockets) {
          webSocket.close();
        }

        webSockets.clear();

        return serverClosePromise;
      },
    };
  }

  function sendStats(sockets: Iterable<WebSocket>, {force = false} = {}) {
    const unchanged =
      !force &&
      stats &&
      (!stats.errors || stats.errors.length === 0) &&
      stats.assets &&
      stats.assets.every((asset: any) => !asset.emitted);

    if (unchanged) {
      send(sockets, 'stats', {hash: stats.hash, status: 'unchanged'});
    } else if (stats.errors.length > 0) {
      send(sockets, 'stats', {
        hash: stats.hash,
        status: 'errors',
        errors: stats.errors,
      });
    } else if (stats.warnings.length > 0) {
      send(sockets, 'stats', {
        hash: stats.hash,
        status: 'warnings',
        warnings: stats.warnings,
      });
    } else {
      send(sockets, 'stats', {hash: stats.hash, status: 'ok'});
    }
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

function send<T extends keyof MessageMap>(
  sockets: Iterable<WebSocket>,
  type: T,
  data?: MessageMap[T],
) {
  for (const socket of sockets) {
    if (socket.readyState !== 1) continue;
    socket.send(JSON.stringify({type, data: data ?? {}}));
  }
}
