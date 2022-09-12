import {useState, useEffect, useMemo, useCallback} from 'react';
import {signal, computed, effect, type Signal} from '@preact/signals-core';

const EMPTY_ARGUMENTS = Object.freeze([]) as any as unknown[];

export function useSignal<T>(
  value: T,
  args: unknown[] = EMPTY_ARGUMENTS,
): Signal<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => signal(value), args);
}

export function useComputed<T>(
  value: () => T,
  args: unknown[] = EMPTY_ARGUMENTS,
): Signal<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => computed(value), args);
}

export function useSignalState<T>(signal: Signal<T>) {
  const value = useSignalValue(signal);
  const set = useCallback(
    (value: T | ((current: T) => T)) => {
      signal.value =
        typeof value === 'function' ? (value as any)(signal.value) : value;
    },
    [signal],
  );

  return [value, set] as const;
}

export function useSignalValue<T>(signal: Signal<T>) {
  const [details, setDetails] = useState(() => ({
    signal,
    value: signal.value,
  }));

  let valueToReturn = details.value;

  if (details.signal !== signal) {
    valueToReturn = signal.value;
    setDetails({value: valueToReturn, signal});
  }

  useEffect(() => {
    let didUnsubscribe = false;

    const checkForUpdates = (newValue: T) => {
      if (didUnsubscribe) {
        return;
      }

      setDetails((currentDetails) => {
        const {value: currentValue, signal} = currentDetails;
        if (currentValue === newValue) return currentDetails;
        return {value: newValue, signal};
      });
    };

    const teardown = effect(() => {
      checkForUpdates(signal.value);
    });

    return () => {
      didUnsubscribe = true;
      teardown();
    };
  }, [signal]);

  return valueToReturn;
}