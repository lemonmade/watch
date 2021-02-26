import {createContext, useContext, useEffect} from 'react';

type GlobalEvent = 'resize' | 'scroll' | 'pointerdown';

export class GlobalEventManager {
  private readonly eventMap = new Map<GlobalEvent, Set<() => void>>();
  private readonly listenerMap = new Map<GlobalEvent, () => void>();

  on(event: GlobalEvent, handler: () => void): () => void {
    let handlers = this.eventMap.get(event);

    if (handlers == null) {
      handlers = new Set();
      this.eventMap.set(event, handlers);
    }

    if (!this.listenerMap.has(event)) {
      const listener = () => {
        for (const handler of handlers!) {
          handler();
        }
      };

      addEventListener(event, listener);
      this.listenerMap.set(event, listener);
    }

    handlers.add(handler);

    return () => {
      handlers!.delete(handler);
      if (handlers!.size === 0) {
        const listener = this.listenerMap.get(event);

        if (listener) {
          removeEventListener(event, listener);
          this.listenerMap.delete(event);
        }
      }
    };
  }
}

function addEventListener(event: GlobalEvent, listener: () => void) {
  targetForEvent(event).addEventListener(event, listener, {passive: true});
}

function removeEventListener(event: GlobalEvent, listener: () => void) {
  targetForEvent(event).removeEventListener(event, listener, {passive: true});
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

  useEffect(() => globalEventContext.on(event, handler), [
    event,
    handler,
    globalEventContext,
  ]);
}
