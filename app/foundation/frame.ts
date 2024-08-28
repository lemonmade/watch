import {AsyncComponent} from '@quilted/quilt/async';

export const Frame = AsyncComponent.from(() => import('./frame/Frame.tsx'));
