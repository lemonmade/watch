import type {SeasonDetailsApi} from './SeasonDetails';
import type {WatchThroughDetailsApi} from './WatchThroughDetails';
import type {SeriesDetailsApi} from './SeriesDetails';

export type {StandardApi, Version} from './shared';

export type AnyApi =
  | SeasonDetailsApi
  | SeriesDetailsApi
  | WatchThroughDetailsApi;

export type {SeasonDetailsApi, SeriesDetailsApi, WatchThroughDetailsApi};
