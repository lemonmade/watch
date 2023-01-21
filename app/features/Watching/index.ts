import {createAsyncComponent} from '@quilted/quilt';

export const Watching = createAsyncComponent(() => import('./Watching'));
export const FinishedWatching = createAsyncComponent(
  () => import('./FinishedWatching'),
);
