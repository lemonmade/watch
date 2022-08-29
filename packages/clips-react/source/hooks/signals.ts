import {useEffect, useState} from 'react';
import {effect, type Signal} from '@watching/thread-signals';

export {type Signal};

/**
 * Subscribes to a remote subscribable wrapper for a value, returning you
 * the most recent value and re-rendering on changes.
 */
export function useSignal<T>(signal: Signal<T>): T {
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
