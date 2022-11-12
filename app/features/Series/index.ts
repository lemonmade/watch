import {createAsyncComponent} from '@quilted/quilt';

export {SeriesDetailsRenderAccessoryExtensionPoint} from './clips';

export const Series = createAsyncComponent(() => import('./Series'));
export const RandomSeries = createAsyncComponent(
  () => import('./RandomSeries'),
);
