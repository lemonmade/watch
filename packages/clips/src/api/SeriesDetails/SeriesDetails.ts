import type {StandardApi} from '../shared';

export interface Series {
  id: string;
  name: string;
}

export interface SeriesDetailsApi
  extends StandardApi<'Watch::Series::Details'> {
  readonly series: Series;
}
