import {createAsyncComponent} from '@quilted/quilt';

export const ComponentLibrary = createAsyncComponent(
  () => import('./ComponentLibrary'),
);
