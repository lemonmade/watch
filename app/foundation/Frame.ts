import {createAsyncComponent} from '@quilted/quilt/async';

export const Frame = createAsyncComponent(() => import('./Frame/Frame.tsx'));
