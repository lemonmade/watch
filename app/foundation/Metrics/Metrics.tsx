import {
  usePerformanceNavigationEvent,
  type PropsWithChildren,
} from '@quilted/quilt';

export function Metrics({children}: PropsWithChildren) {
  usePerformanceNavigationEvent(async (navigation) => {
    await fetch('/internal/metrics/navigation', {
      method: 'POST',
      body: JSON.stringify({
        navigations: [navigation.toJSON()],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  return <>{children}</>;
}
