import {type Api} from './api.ts';

export function getQuery<Query = Record<string, unknown>>(
  apiOrQuery: Pick<Api<any, any, any>, 'query'> | Api<any, any, any>['query'],
) {
  return 'query' in apiOrQuery
    ? (apiOrQuery.query.value as any as Query)
    : (apiOrQuery.value as any as Query);
}
