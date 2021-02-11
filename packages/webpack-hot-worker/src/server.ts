import {Server as HttpServer} from 'http';

import {Server as WebSocketServer, OPEN} from 'ws';
import type {Compiler, MultiCompiler} from 'webpack';
import stripAnsi from 'strip-ansi';

import type {BuildState, WebSocketEventMap} from './types';

type WebSocket = WebSocketServer['clients'] extends Set<infer T> ? T : never;

export interface Options {
  readonly server: HttpServer;
  readonly compiler: Compiler | MultiCompiler;
}

export function createWebSocketServer({
  server,
  compiler: maybeMultiCompiler,
}: Options) {
  let buildState: BuildState | undefined;

  const webSocketServer = new WebSocketServer({server});

  const compilers =
    'compilers' in maybeMultiCompiler
      ? maybeMultiCompiler.compilers
      : [maybeMultiCompiler];

  for (const compiler of compilers) {
    compiler.hooks.compile.tap('DevWebSocketServer', () => {
      send(webSocketServer.clients, 'compile', {
        compiler: (compiler as Compiler).name || undefined,
      });
    });

    // eslint-disable-next-line no-loop-func
    compiler.hooks.invalid.tap('DevWebSocketServer', (filePath) => {
      const context =
        compiler.context ?? compiler.options.context ?? process.cwd();

      send(webSocketServer.clients, 'invalidate', {
        file: (filePath ?? '').replace(context, '').substring(1) || undefined,
      });
    });
  }

  maybeMultiCompiler.hooks.done.tap('DevWebSocketServer', (newStats: any) => {
    const stats = newStats.toJson({
      context: process.cwd(),
      errors: true,
      warnings: true,
      assets: true,
      hash: true,
      all: false,
    });

    if (stats.errors && stats.errors.length > 0) {
      buildState = {
        hash: stats.hash!,
        status: 'errors',
        errors: [...stats.errors].map((error) => stripAnsi(error)),
      };
    } else if (stats.warnings.length > 0) {
      buildState = {
        hash: stats.hash!,
        status: 'warnings',
        warnings: [...stats.warnings].map((warning) => stripAnsi(warning)),
      };
    } else {
      buildState = {hash: stats.hash!, status: 'ok'};
    }

    const unchanged =
      stats &&
      (!stats.errors || stats.errors.length === 0) &&
      stats.assets &&
      stats.assets.every((asset: any) => !asset.emitted);

    send(
      webSocketServer.clients,
      'done',
      unchanged ? {status: 'unchanged', hash: buildState.hash} : buildState,
    );
  });

  webSocketServer.on('connection', (socket) => {
    send([socket], 'connect', buildState ?? {status: 'building'});
  });

  return {
    server: webSocketServer,
    close() {
      return new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    },
  };
}

function send<T extends keyof WebSocketEventMap>(
  sockets: Iterable<WebSocket>,
  type: T,
  data?: WebSocketEventMap[T],
) {
  for (const socket of sockets) {
    if (socket.readyState !== OPEN) continue;
    socket.send(JSON.stringify({type, data: data ?? {}}));
  }
}
