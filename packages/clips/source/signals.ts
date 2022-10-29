import {
  acceptThreadSignal,
  type ThreadSignal,
  type Signal,
} from '@watching/thread-signals';

export {type Signal};

export type WithThreadSignals<T> = T extends object
  ? {[K in keyof T]: T[K] extends ThreadSignal<infer U> ? Signal<U> : T[K]}
  : never;

export function acceptSignals<T>(value: T): WithThreadSignals<T> {
  const acceptedValue: Record<string, any> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (
      typeof nestedValue === 'object' &&
      nestedValue != null &&
      'initial' in nestedValue &&
      typeof nestedValue.start === 'function'
    ) {
      acceptedValue[key] = acceptThreadSignal(nestedValue);
    } else {
      acceptedValue[key] = nestedValue;
    }
  }

  return acceptedValue as any;
}
