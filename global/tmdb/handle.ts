import {toHandle} from '../strings.ts';
import {TmdbSeries} from './types.ts';

export function seriesToHandle(series: Pick<TmdbSeries, 'id' | 'name'>) {
  return `${toHandle(series.name)}-${series.id}`;
}
