import {createAsyncComponent} from '@quilted/quilt';

export const ComponentLibrary = createAsyncComponent(
  () => import('./Internal/ComponentLibrary.tsx'),
);
