import {AsyncComponent} from '@quilted/quilt/async';

export const Start = AsyncComponent.from(() => import('./Start/Start.tsx'));
