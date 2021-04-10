import {useEffect, useState} from 'react';
import type {StatefulRemoteSubscribable} from '@remote-ui/async-subscription';

type Subscriber<T> = Parameters<StatefulRemoteSubscribable<T>['subscribe']>[0];

export type {StatefulRemoteSubscribable};

/**
 * Subscribes to a remote subscribable wrapper for a value, returning you
 * the most recent value and re-rendering on changes.
 */
export function useSubscription<T>(
  subscribable: StatefulRemoteSubscribable<T>,
): T {
  const [details, setDetails] = useState(() => ({
    subscribable,
    value: subscribable.current,
  }));

  let valueToReturn = details.value;

  if (details.subscribable !== subscribable) {
    valueToReturn = subscribable.current;
    setDetails({value: valueToReturn, subscribable});
  }

  useEffect(() => {
    let didUnsubscribe = false;

    const checkForUpdates: Subscriber<T> = (newValue) => {
      if (didUnsubscribe) {
        return;
      }

      setDetails((currentDetails) => {
        const {value: currentValue, subscribable} = currentDetails;
        if (currentValue === newValue) return currentDetails;
        return {value: currentValue, subscribable};
      });
    };

    const unsubscribe = subscribable.subscribe(checkForUpdates);

    // Because we're subscribing in a passive effect,
    // it's possible that an update has occurred between render and our effect handler.
    // Check for this and schedule an update if work has occurred.
    checkForUpdates(subscribable.current);

    return () => {
      didUnsubscribe = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribable]);

  return valueToReturn;
}
