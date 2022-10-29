import {type Signal} from '@preact/signals-core';
import {retain, release, acceptThreadAbortSignal} from '@quilted/threads';

import {type ThreadSignal} from './types';

export function createThreadSignal<T>(
  signal: Signal<T>,
  {writable = false} = {},
): ThreadSignal<T> {
  return {
    initial: signal.value,
    set: writable
      ? (value) => {
          signal.value = value;
        }
      : undefined,
    start(subscriber, {signal: threadAbortSignal} = {}) {
      retain(subscriber);

      const abortSignal =
        threadAbortSignal && acceptThreadAbortSignal(threadAbortSignal);

      const teardown = signal.subscribe(subscriber);

      abortSignal?.addEventListener('abort', () => {
        teardown();
        release(subscriber);
      });

      return signal.value;
    },
  };
}
