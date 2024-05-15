import {AsyncComponent} from '@quilted/quilt/async';

export const Subscriptions = AsyncComponent.from(
  () => import('./Subscriptions/Subscriptions.tsx'),
);
