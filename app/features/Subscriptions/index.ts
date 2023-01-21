import {createAsyncComponent} from '@quilted/quilt';

export const Subscriptions = createAsyncComponent(
  () => import('./Subscriptions'),
);
