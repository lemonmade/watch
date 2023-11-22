import type {PropsWithChildren} from 'react';
import {usePerformanceNavigationEvent} from '@quilted/quilt/performance';
import Env from '@quilted/quilt/env';

export function Metrics({children}: PropsWithChildren) {
  usePerformanceNavigationEvent(async (navigation) => {
    if (Env.MODE === 'development') {
      console.log('Navigation');
      console.log(navigation);
      return;
    }

    const requestData = JSON.stringify({
      navigations: [navigation.toJSON()],
    });

    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/internal/metrics/navigation', requestData);
    } else {
      await fetch('/internal/metrics/navigation', {
        method: 'POST',
        body: requestData,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  });

  return <>{children}</>;
}
