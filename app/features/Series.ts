import {AsyncComponent} from '@quilted/quilt/async';

export {SeriesDetailsAccessoryExtensionPoint} from './Series/clips.ts';

export const Series = AsyncComponent.from(() => import('./Series/Series.tsx'));
export const RandomSeries = AsyncComponent.from(
  () => import('./Series/RandomSeries.tsx'),
);
