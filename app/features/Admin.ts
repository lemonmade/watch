import {AsyncComponent} from '@quilted/quilt/async';

export const Admin = AsyncComponent.from(() => import('./Admin/Admin.tsx'));
