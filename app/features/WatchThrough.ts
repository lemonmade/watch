import {AsyncComponent} from '@quilted/quilt/async';

export {WatchThroughDetailsAccessoryExtensionPoint} from './WatchThrough/clips.ts';

export const WatchThrough = AsyncComponent.from(
  () => import('./WatchThrough/WatchThrough.tsx'),
);

export const RandomWatchThrough = AsyncComponent.from(
  () => import('./WatchThrough/RandomWatchThrough.tsx'),
);
