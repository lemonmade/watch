import {createAsyncComponent} from '@quilted/quilt';

export const Watching = createAsyncComponent(
  () => import('./Watching/Watching.tsx'),
);

export const FinishedWatching = createAsyncComponent(
  () => import('./Watching/FinishedWatching.tsx'),
);
