import {createContext, useContext, useEffect} from 'react';
import {
  addListener,
  createEmitterWithInternals,
  type Emitter,
} from '@quilted/events';

type GlobalEvent = 'resize' | 'scroll' | 'pointerdown';

type GlobalEventMap = {
  [Event in GlobalEvent]: HTMLElement;
};

export interface GlobalEventManager
  extends Pick<Emitter<GlobalEventMap>, 'on'> {}

export const GlobalEventContext = createContext<GlobalEventManager>(
  createGlobalEventManager(),
);

export function useGlobalEvents() {
  return useContext(GlobalEventContext);
}

function createGlobalEventManager(): GlobalEventManager {
  const emitter = createEmitterWithInternals<GlobalEventMap>();
  const abortByEvent = new Map<GlobalEvent, AbortController>();

  emitter.internal.on('add', ({event}) => {
    if (abortByEvent.has(event)) return;

    const abort = new AbortController();
    abortByEvent.set(event, abort);

    addListener(
      targetForEvent(event),
      event,
      (pointerEvent) => {
        emitter.emit(event, pointerEvent.target);
      },
      {signal: abort.signal},
    );
  });

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

  useEffect(
    () => globalEventContext.on(event, handler),
    [event, handler, globalEventContext],
  );
}

function targetForEvent(event: GlobalEvent) {
  switch (event) {
    case 'pointerdown':
      return document;
    default:
      return window;
  }
}
