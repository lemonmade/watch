import {createAsyncComponent} from '@quilted/quilt';

export const Admin = createAsyncComponent(() => import('./Admin/Admin.tsx'));
