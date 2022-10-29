import {type ThreadAbortSignal} from '@quilted/threads';

export interface ThreadSignal<T> {
  initial: T;
  set?(value: T): void;
  start(
    subscriber: (value: T) => void | Promise<void>,
    options?: {signal?: AbortSignal | ThreadAbortSignal},
  ): T | Promise<T>;
}
