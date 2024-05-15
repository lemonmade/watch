import {AsyncComponent} from '@quilted/quilt/async';

export const Search = AsyncComponent.from(() => import('./Search/Search.tsx'));
