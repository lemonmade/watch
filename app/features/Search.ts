import {createAsyncComponent} from '@quilted/quilt/async';

export const Search = createAsyncComponent(() => import('./Search/Search.tsx'));
