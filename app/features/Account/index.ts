import {createAsyncComponent} from '@quilted/quilt';

export const Account = createAsyncComponent(() => import('./Account'));

export const Payment = createAsyncComponent(() => import('./Payment'));
