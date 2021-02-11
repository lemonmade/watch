// mini implementation of https://github.com/webpack/webpack-dev-server/blob/master/client-src/default/index.js#L27

// @ts-ignore
import hotEmitter from 'webpack/hot/emitter';
import type {MessageMap} from './types';

// Injected by Webpack
declare const __DEV_SERVER_HOT_ENDPOINT__: string;

type EventHandler<T> = (data: T) => void;

interface HotClient {
  start(): void;
  stop(): void;
  on<T extends keyof MessageMap>(
    event: T,
    handler: EventHandler<MessageMap[T]>,
  ): () => void;
}

const hotClient = createHotClient();
hotClient.start();

export function createHotClient(): HotClient {
  let hash: string | undefined;
  let open = false;
  let webSocket: WebSocket | undefined;
  let retries = 0;

  const eventMap = new Map<
    keyof MessageMap,
    Set<EventHandler<MessageMap[keyof MessageMap]>>
  >();

  const cleanupActions = new Set<() => void>();

  const client: HotClient = {
    start() {
      openWebSocket();
    },
    stop() {
      for (const cleanup of cleanupActions) {
        cleanup();
      }

      cleanupActions.clear();
    },
    on(event, handler) {
      if (!eventMap.has(event)) {
        eventMap.set(event, new Set());
      }

      const handlers = eventMap.get(event)!;
      handlers.add(handler as any);
      return () => handlers.delete(handler as any);
    },
  };

  client.on('stats', ({hash: newHash, status}) => {
    hash = newHash;

    if (!open) {
      open = true;
      return;
    }

    if (status === 'ok' || status === 'warnings') {
      hotEmitter.emit('webpackHotUpdate', hash);
    }
  });

  return client;

  function openWebSocket() {
    webSocket = new WebSocket(__DEV_SERVER_HOT_ENDPOINT__);

    const handleOpen = () => {
      retries = 0;
    };

    const handleClose = () => {
      if (retries === 0) emit('close');
      webSocket = undefined;

      if (retries <= 10) {
        const retryInMs = 1_000 * 2 ** retries + Math.random() * 100;
        retries += 1;

        const timeout = setTimeout(() => {
          cleanupActions.delete(cleanup);
          openWebSocket();
        }, retryInMs);

        const cleanup = () => {
          clearTimeout(timeout);
        };

        cleanupActions.add(cleanup);
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

      emit(parsedEvent.type, parsedEvent.data);
    };

    webSocket.addEventListener('open', handleOpen);
    webSocket.addEventListener('close', handleClose);
    webSocket.addEventListener('message', handleMessage);

    cleanupActions.add(() => {
      webSocket?.close();
      webSocket?.removeEventListener('open', handleOpen);
      webSocket?.removeEventListener('close', handleClose);
      webSocket?.removeEventListener('message', handleMessage);
      webSocket = undefined;
    });
  }

  function emit<T extends keyof MessageMap>(event: T, data?: MessageMap[T]) {
    const handlers = eventMap.get(event);

    if (handlers == null) {
      // eslint-disable-next-line no-console
      console.warn(
        `unknown message type: ${event}, data: ${JSON.stringify(data)}`,
      );
      return;
    }

    for (const handler of handlers) {
      handler(data ?? ({} as any));
    }
  }
}
