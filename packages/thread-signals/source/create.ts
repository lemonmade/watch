import {type Signal} from '@preact/signals-core';
import {anyAbortSignal} from '@quilted/events';
import {retain, release, acceptThreadAbortSignal} from '@quilted/threads';

import {type ThreadSignal} from './types';

export function createThreadSignal<T>(
  signal: Signal<T>,
  {
    writable = false,
    signal: teardownAbortSignal,
  }: {writable?: boolean; signal?: AbortSignal} = {},
): ThreadSignal<T> {
  return {
    get initial() {
      return signal.peek();
    },
    set:
      writable && !isReadonlySignal(signal)
        ? (value) => {
            signal.value = value;
          }
        : undefined,
    start(subscriber, {signal: threadAbortSignal} = {}) {
      retain(subscriber);

      const abortSignal =
        threadAbortSignal && acceptThreadAbortSignal(threadAbortSignal);

      const finalAbortSignal =
        abortSignal && teardownAbortSignal
          ? anyAbortSignal(abortSignal, teardownAbortSignal)
          : abortSignal ?? teardownAbortSignal;

      const teardown = signal.subscribe(subscriber);

      finalAbortSignal?.addEventListener('abort', () => {
        teardown();
        release(subscriber);
      });

      return signal.peek();
    },
  };
}

function isReadonlySignal<T>(signal: Signal<T>): boolean {
  return (
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(signal), 'value')
      ?.set == null
  );
}
