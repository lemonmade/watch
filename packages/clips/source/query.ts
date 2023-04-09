import {type Api} from './api.ts';
import {type WithThreadSignals} from './signals.ts';

export function getQuery<Data = Record<string, unknown>>(
  apiOrQuery:
    | Pick<WithThreadSignals<Api<any>>, 'query'>
    | WithThreadSignals<Api<any>>['query'],
) {
  return 'query' in apiOrQuery
    ? (apiOrQuery.query.value as any as Data)
    : (apiOrQuery.value as any as Data);
}
