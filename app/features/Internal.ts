import {AsyncComponent} from '@quilted/quilt/async';

export const ComponentLibrary = AsyncComponent.from(
  () => import('./Internal/ComponentLibrary.tsx'),
);
