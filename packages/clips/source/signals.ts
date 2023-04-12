import {
  acceptThreadSignal,
  type ThreadSignal,
  type Signal,
} from '@watching/thread-signals';

export {type Signal};

export type SignalOrValue<T> = T | Signal<T>;

export type WithThreadSignals<T> = {
  [K in keyof T]: T[K] extends ThreadSignal<infer U> ? Signal<U> : T[K];
};

export function acceptSignals<T extends {}>(value: T): WithThreadSignals<T> {
  const acceptedValue: Record<string, any> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (
      typeof nestedValue === 'object' &&
      nestedValue != null &&
      'initial' in nestedValue &&
      typeof (nestedValue as any).start === 'function'
    ) {
      acceptedValue[key] = acceptThreadSignal(nestedValue as any);
    } else {
      acceptedValue[key] = nestedValue;
    }
  }

  return acceptedValue as any;
}
