import type {EventHandler} from './types';

export interface Emitter<T extends Record<string, any>> {
  emit<K extends keyof T>(
    event: K,
    ...data: T[K] extends never ? [] : [T[K]]
  ): void;
  on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): () => void;
  clear(): void;
}

export function createEmitter<T extends Record<string, any>>(): Emitter<T> {
  const eventHandlers = new Map<keyof T, Set<EventHandler<T[keyof T]>>>();

  return {
    emit(event, ...rest) {
      const [data = {} as any] = rest;
      const handlers = eventHandlers.get(event);

      if (handlers == null) return;

      for (const handler of handlers) {
        handler(data);
      }
    },
    on(event, handler) {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, new Set());
      }

      const handlers = eventHandlers.get(event)!;
      handlers.add(handler as any);
      return () => handlers.delete(handler as any);
    },
    clear() {
      eventHandlers.clear();
    },
  };
}
