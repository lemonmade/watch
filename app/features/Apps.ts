import {AsyncComponent} from '@quilted/quilt/async';

export const Apps = AsyncComponent.from(() => import('./Apps/Apps.tsx'));
