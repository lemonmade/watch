import {createContext, useContext, useEffect} from 'react';
// import {createEmitter, type Emitter} from '@quilted/events';

type GlobalEvent = 'resize' | 'scroll' | 'pointerdown';

export class GlobalEventManager {
  private readonly eventMap = new Map<
    GlobalEvent,
    Set<(target: HTMLElement) => void>
  >();

  private readonly listenerMap = new Map<GlobalEvent, () => void>();

  on(event: GlobalEvent, handler: (target: HTMLElement) => void): () => void {
    let handlers = this.eventMap.get(event);

    if (handlers == null) {
      handlers = new Set();
      this.eventMap.set(event, handlers);
    }

    if (!this.listenerMap.has(event)) {
      const listener = (element: HTMLElement) => {
        for (const handler of handlers!) {
          handler(element);
        }
      };

      this.listenerMap.set(event, addEventListener(event, listener));
    }

    handlers.add(handler);

    return () => {
      handlers!.delete(handler);
      if (handlers!.size === 0) {
        const listener = this.listenerMap.get(event);

        if (listener) {
          listener();
          this.listenerMap.delete(event);
        }
      }
    };
  }
}

function addEventListener(
  event: GlobalEvent,
  listener: (element: HTMLElement) => void,
) {
  const wrappedListener = (event: Event) => {
    listener(event.target as any);
  };

  targetForEvent(event).addEventListener(event, wrappedListener, {
    passive: true,
  });

  return () => {
    removeEventListener(event, wrappedListener);
  };
}

function removeEventListener(
  event: GlobalEvent,
  listener: (event: Event) => void,
) {
  targetForEvent(event).removeEventListener(event, listener);
}

function targetForEvent(event: GlobalEvent) {
  switch (event) {
    case 'pointerdown':
      return document;
    default:
      return window;
  }
}

export const GlobalEventContext = createContext<GlobalEventManager>(
  new GlobalEventManager(),
);

export function useGlobalEvents() {
  return useContext(GlobalEventContext);
}

export function useGlobalEventListener(
  event: GlobalEvent,
  handler: () => void,
) {
  const globalEventContext = useGlobalEvents();

  useEffect(
    () => globalEventContext.on(event, handler),
    [event, handler, globalEventContext],
  );
}
