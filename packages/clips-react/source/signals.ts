import {
  useRef,
  useMemo,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from 'react';
import {
  signal,
  computed,
  batch,
  effect,
  Signal,
  type ReadonlySignal,
} from '@preact/signals-core';

const EMPTY: unknown[] = [];

export {signal, computed, batch, effect, Signal, type ReadonlySignal};

export function useSignal<T>(value: T, dependencies: any[] = EMPTY) {
  return useMemo(() => signal<T>(value), dependencies);
}

export function useComputed<T>(compute: () => T, dependencies: any[] = EMPTY) {
  const $compute = useRef(compute);
  $compute.current = compute;
  return useMemo(() => computed<T>(() => $compute.current()), dependencies);
}

export function useSignalEffect(
  cb: () => void | (() => void),
  dependencies: any[] = EMPTY,
) {
  const callback = useRef(cb);
  callback.current = cb;

  useEffect(() => {
    return effect(() => {
      callback.current();
    });
  }, dependencies);
}

export function useSignalState<T>(signal: Signal<T>) {
  const value = useSignalValue(signal);
  const update = useCallback(
    (update: T | ((current: T) => T)) => {
      signal.value =
        typeof update === 'function' ? (update as any)(signal.peek()) : update;
    },
    [signal],
  );

  return [value, update] as const;
}

export function useSignalValue<T>(signal: Signal<T>) {
  const [subscribe, getSnapshot] = useMemo<
    Parameters<typeof useSyncExternalStore<T>>
  >(
    () => [(subscribe) => signal.subscribe(subscribe), () => signal.peek()],
    [signal],
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
