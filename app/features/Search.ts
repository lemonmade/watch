import {createAsyncComponent} from '@quilted/quilt';

export const Search = createAsyncComponent(() => import('./Search/Search.tsx'));
