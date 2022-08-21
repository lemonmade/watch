import {createAsyncComponent} from '@quilted/quilt';

export const WatchThrough = createAsyncComponent(
  () => import('./WatchThrough'),
);

export const RandomWatchThrough = createAsyncComponent(
  () => import('./RandomWatchThrough'),
);
