import {createAsyncComponent} from '@quilted/quilt';

export const WatchThrough = createAsyncComponent(
  () => import('./WatchThrough'),
);
