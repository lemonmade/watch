import type {WatchThroughDetailsApi} from './WatchThroughDetails';
import type {SeriesDetailsApi} from './SeriesDetails';

export type {StandardApi, Version} from './shared';

export type AnyApi = SeriesDetailsApi | WatchThroughDetailsApi;

export type {SeriesDetailsApi, WatchThroughDetailsApi};
