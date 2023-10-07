import {createAsyncComponent} from '@quilted/quilt/async';

export const Apps = createAsyncComponent(() => import('./Apps/Apps.tsx'));
