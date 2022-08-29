import {signal as createSignal, effect, type Signal} from '@preact/signals';
import {
  retain,
  release,
  acceptThreadAbortSignal,
  createThreadAbortSignal,
  type ThreadAbortSignal,
} from '@quilted/quilt/threads';

export interface ThreadSignal<T> {
  initial: T;
  start(
    subscriber: (value: T) => void | Promise<void>,
    options?: {signal?: AbortSignal | ThreadAbortSignal},
  ): T | Promise<T>;
}

export function createThreadSignal<T>(signal: Signal<T>): ThreadSignal<T> {
  return {
    initial: signal.value,
    start(subscriber, {signal: threadAbortSignal} = {}) {
      retain(subscriber);

      const abortSignal =
        threadAbortSignal && acceptThreadAbortSignal(threadAbortSignal);

      const teardown = effect(() => {
        subscriber(signal.value);
      });

      abortSignal?.addEventListener('abort', () => {
        teardown();
        release(subscriber);
      });

      return signal.value;
    },
  };
}

export function acceptThreadSignal<T>(
  threadSignal: ThreadSignal<T>,
  {signal: abortSignal}: {signal?: AbortSignal} = {},
): Signal<T> {
  const signal = createSignal(threadSignal.initial);
  const threadAbortSignal = abortSignal && createThreadAbortSignal(abortSignal);

  const setValue = (value: T) => {
    signal.value = value;
  };

  Promise.resolve(
    threadSignal.start(setValue, {signal: threadAbortSignal}),
  ).then(setValue);

  return signal;
}
