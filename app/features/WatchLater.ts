import {createAsyncComponent} from '@quilted/quilt';

export const WatchLater = createAsyncComponent(
  () => import('./WatchLater/WatchLater.tsx'),
);
