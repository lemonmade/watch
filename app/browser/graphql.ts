import {
  GraphQLCache,
  createGraphQLFetch,
  type GraphQLFetch,
} from '@quilted/quilt/graphql';

import type {GraphQL} from '~/shared/graphql.ts';
import {SearchParam} from '~/global/auth.ts';

export class GraphQLForBrowser implements GraphQL {
  cache = new GraphQLCache();

  fetch: GraphQLFetch = async (...args) => {
    const result = await this.#fetchGraphQLBase(...args);

    if (result.errors?.some((error) => (error as any).status === 401)) {
      const signInUrl = new URL('/sign-in', location.href);
      signInUrl.searchParams.set(SearchParam.RedirectTo, location.href);
      location.assign(signInUrl.href);
    }

    return result;
  };

  #fetchGraphQLBase =
    process.env.NODE_ENV === 'production'
      ? createGraphQLFetch({
          method: (operation) =>
            operation.source.startsWith('mutation ') ? 'POST' : 'GET',
          url: (operation) => {
            const url = new URL(`/api/graphql`, location.href);
            if (operation.name) url.searchParams.set('name', operation.name);
            url.searchParams.set('id', operation.id);
            return url;
          },
          source: false,
          credentials: 'include',
        })
      : createGraphQLFetch({
          url: (operation) => {
            const url = new URL(`/api/graphql`, location.href);
            if (operation.name) url.searchParams.set('name', operation.name);
            return url;
          },
          credentials: 'include',
        });
}
