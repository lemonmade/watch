import {createAsyncComponent} from '@quilted/quilt';

export {SeriesDetailsAccessoryExtensionPoint} from './Series/clips.ts';

export const Series = createAsyncComponent(() => import('./Series/Series.tsx'));
export const RandomSeries = createAsyncComponent(
  () => import('./Series/RandomSeries.tsx'),
);
