import {createAsyncComponent} from '@quilted/quilt';

export {WatchThroughDetailsRenderAccessoryExtensionPoint} from './clips';

export const WatchThrough = createAsyncComponent(
  () => import('./WatchThrough'),
);

export const RandomWatchThrough = createAsyncComponent(
  () => import('./RandomWatchThrough'),
);
