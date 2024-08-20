import {type Signal} from '@preact/signals-core';
import {ThreadSignal} from '@quilted/threads/signals';

export {type Signal};

export type SignalOrValue<T> = T | Signal<T>;

export type WithThreadSignals<T> = {
  [K in keyof T]: T[K] extends Signal<infer U> ? ThreadSignal<U> : T[K];
};

export function acceptSignals<T extends {}>(value: WithThreadSignals<T>): T {
  const acceptedValue: Record<string, any> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (
      typeof nestedValue === 'object' &&
      nestedValue != null &&
      'initial' in nestedValue &&
      typeof (nestedValue as any).start === 'function'
    ) {
      acceptedValue[key] = new ThreadSignal(nestedValue as any);
    } else {
      acceptedValue[key] = nestedValue;
    }
  }

  return acceptedValue as any;
}
