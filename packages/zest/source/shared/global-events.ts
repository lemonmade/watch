import {createContext, useContext, useEffect} from 'react';
import {EventEmitter} from '@quilted/events';

type GlobalEvent = 'resize' | 'scroll' | 'pointerdown' | 'keyup';

type GlobalEventMap = {
  [EventName in GlobalEvent]: Event;
};

export interface GlobalEventManager
  extends Pick<EventEmitter<GlobalEventMap>, 'on'> {}

export const GlobalEventContext = createContext<GlobalEventManager>(
  createGlobalEventManager(),
);

export function useGlobalEvents() {
  return useContext(GlobalEventContext);
}

function createGlobalEventManager(): GlobalEventManager {
  const emitter = new EventEmitter<GlobalEventMap>();
  const abortByEvent = new Map<GlobalEvent, AbortController>();

  // @ts-expect-error
  emitter.internal.on('add', ({event: eventName}) => {
    if (abortByEvent.has(eventName)) return;

    const abort = new AbortController();
    abortByEvent.set(eventName, abort);

    targetForEvent(eventName).addEventListener(
      eventName,
      (event) => {
        emitter.emit(eventName, event);
      },
      {signal: abort.signal, passive: true},
    );
  });

  // @ts-expect-error
  emitter.internal.on('remove', ({event, all}) => {
    if (all.size > 0) return;

    const abort = abortByEvent.get(event);
    abortByEvent.delete(event);
    abort?.abort();
  });

  return {
    on: emitter.on,
  };
}

export function useGlobalEventListener(
  event: GlobalEvent,
  handler: () => void,
) {
  const globalEventContext = useGlobalEvents();

  useEffect(() => {
    const abort = new AbortController();
    globalEventContext.on(event, handler, {signal: abort.signal});
    return () => abort.abort();
  }, [event, handler, globalEventContext]);
}

function targetForEvent(event: GlobalEvent) {
  switch (event) {
    case 'pointerdown':
      return document;
    default:
      return window;
  }
}
