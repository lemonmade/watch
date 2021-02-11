import {createDevServerWebSocket} from './websocket';
import type {EventHandler} from './types';
import {createEmitter} from './emitter';

// Injected by Webpack
declare const __DEV_SERVER_HOT_ENDPOINT__: string;

export interface EventMap extends WebSocketEventMap {
  reconnect: {attempt: number; delay: number};
  reload: never;
}

export interface DevHotWorker {
  start(): void;
  stop(): void;
  on<T extends keyof EventMap>(
    event: T,
    handler: EventHandler<EventMap[T]>,
  ): () => void;
}

export interface Options {
  readonly socketUrl?: string;
}

export function createHotWorker({socketUrl}: Options = {}): DevHotWorker {
  const emitter = createEmitter<EventMap>();

  const webSocket = createDevServerWebSocket({
    url: socketUrl ?? getSocketUrlFromInjectedGlobal(),
  });

  let unlisten: ReturnType<typeof webSocket.on> | undefined;

  return {
    start() {
      webSocket.start();

      unlisten = webSocket.on('done', ({status}) => {
        if (status === 'ok' || status === 'warnings') {
          emitter.emit('reload');
        }
      });
    },
    stop() {
      emitter.clear();
      webSocket.stop();
      unlisten?.();
    },
    on: (event, handler) => emitter.on(event, handler),
  };
}

function getSocketUrlFromInjectedGlobal() {
  if (typeof __DEV_SERVER_HOT_ENDPOINT__ === 'undefined') {
    throw new Error(
      `Could not determine the websocket URL to use. Either create the hot worker with an explicit socketUrl, or update your build configuration to provide the socketUrl automatically.`,
    );
  }

  return __DEV_SERVER_HOT_ENDPOINT__;
}
