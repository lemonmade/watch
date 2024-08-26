import {AsyncComponent} from '@quilted/quilt/async';

export const Watching = AsyncComponent.from(
  () => import('./Watching/Watching.tsx'),
);

export const FinishedWatching = AsyncComponent.from(
  () => import('./Watching/FinishedWatching.tsx'),
);
