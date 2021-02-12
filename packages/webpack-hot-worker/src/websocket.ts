import {createEmitter} from './emitter';
import type {WebSocketEventMap, EventHandler} from './types';

export interface EventMap extends WebSocketEventMap {
  reconnect: {attempt: number; delay: number};
}

export interface DevServerWebSocket {
  start(): void;
  stop(): void;
  on<T extends keyof EventMap>(
    event: T,
    handler: EventHandler<EventMap[T]>,
  ): () => void;
}

export interface Options {
  readonly url: string;
}

export function createDevServerWebSocket({url}: Options): DevServerWebSocket {
  let retries = 0;

  const emitter = createEmitter<EventMap>();
  const cleanupActions = new Set<() => void>();

  const client: DevServerWebSocket = {
    start() {
      openWebSocket();
    },
    stop() {
      emitter.clear();

      for (const cleanup of cleanupActions) {
        cleanup();
      }

      cleanupActions.clear();
    },
    on: (event, handler) => emitter.on(event, handler),
  };

  return client;

  function openWebSocket() {
    const webSocket = new WebSocket(url);

    const handleOpen = () => {
      retries = 0;
    };

    const handleClose = () => {
      cleanupActions.delete(cleanup);

      if (retries === 0) emitter.emit('close');

      if (retries <= 10) {
        const retryInMs = 1_000 * 2 ** retries + Math.random() * 100;
        retries += 1;

        emitter.emit('reconnect', {attempt: retries, delay: retryInMs});

        const timeout = setTimeout(() => {
          cleanupActions.delete(openWebSocketTimeoutCleanup);
          openWebSocket();
        }, retryInMs);

        const openWebSocketTimeoutCleanup = () => {
          clearTimeout(timeout);
        };

        cleanupActions.add(openWebSocketTimeoutCleanup);
      }
    };

    const handleMessage = (event: MessageEvent<any>) => {
      const parsedEvent = JSON.parse(event.data);

      if (parsedEvent.type == null || parsedEvent.data == null) {
        // eslint-disable-next-line no-console
        console.warn(
          `unknown websocket message: ${JSON.stringify(parsedEvent)}`,
        );
        return;
      }

      emitter.emit(parsedEvent.type, parsedEvent.data);
    };

    const cleanup = () => {
      webSocket.close();
      webSocket.removeEventListener('open', handleOpen);
      webSocket.removeEventListener('close', handleClose);
      webSocket.removeEventListener('message', handleMessage);
    };

    webSocket.addEventListener('open', handleOpen);
    webSocket.addEventListener('close', handleClose);
    webSocket.addEventListener('message', handleMessage);
    cleanupActions.add(cleanup);
  }
}
