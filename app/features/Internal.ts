import {createAsyncComponent} from '@quilted/quilt';

export const ComponentLibrary = createAsyncComponent(
  () => import('./Internal/ComponentLibrary.tsx'),
);

export const Playground = createAsyncComponent(
  () => import('./Internal/Playground.tsx'),
  {render: 'client'},
);
