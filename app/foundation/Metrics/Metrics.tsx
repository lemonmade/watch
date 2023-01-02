import {
  usePerformanceNavigationEvent,
  type PropsWithChildren,
} from '@quilted/quilt';
import Env from '@quilted/quilt/env';

export function Metrics({children}: PropsWithChildren) {
  usePerformanceNavigationEvent(async (navigation) => {
    const data = navigation.toJSON();

    if (Env.MODE === 'development') {
      // eslint-disable-next-line no-console
      console.log('Navigation');
      // eslint-disable-next-line no-console
      console.log(data);
      return;
    }

    const requestData = JSON.stringify({
      navigations: [data],
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
