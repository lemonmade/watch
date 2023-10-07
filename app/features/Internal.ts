import {createAsyncComponent} from '@quilted/quilt/async';

export const ComponentLibrary = createAsyncComponent(
  () => import('./Internal/ComponentLibrary.tsx'),
);
