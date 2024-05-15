import {AsyncComponent} from '@quilted/quilt/async';

export const WatchLater = AsyncComponent.from(
  () => import('./WatchLater/WatchLater.tsx'),
);
