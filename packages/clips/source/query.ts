import {type Signal} from './signals.ts';

export function getQuery<Query = Record<string, unknown>>(
  apiOrQuery: Signal<Query> | {query: Signal<Query>},
) {
  return 'query' in apiOrQuery
    ? (apiOrQuery.query.value as any as Query)
    : (apiOrQuery.value as any as Query);
}
