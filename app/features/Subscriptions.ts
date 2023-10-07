import {createAsyncComponent} from '@quilted/quilt/async';

export const Subscriptions = createAsyncComponent(
  () => import('./Subscriptions/Subscriptions.tsx'),
);
