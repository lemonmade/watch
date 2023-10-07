import {createAsyncComponent} from '@quilted/quilt/async';

export const WatchLater = createAsyncComponent(
  () => import('./WatchLater/WatchLater.tsx'),
);
