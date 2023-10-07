import {createAsyncComponent} from '@quilted/quilt/async';

export const Admin = createAsyncComponent(() => import('./Admin/Admin.tsx'));
