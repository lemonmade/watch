import {createAsyncComponent} from '@quilted/quilt';

export {WatchThroughDetailsAccessoryExtensionPoint} from './WatchThrough/clips.ts';

export const WatchThrough = createAsyncComponent(
  () => import('./WatchThrough/WatchThrough.tsx'),
);

export const RandomWatchThrough = createAsyncComponent(
  () => import('./WatchThrough/RandomWatchThrough.tsx'),
);
