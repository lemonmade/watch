import '@quilted/quilt/globals';
import {hydrate} from 'preact';
import {AsyncComponent} from '@quilted/quilt/async';
import {type GraphQLFetch, createGraphQLFetch} from '@quilted/quilt/graphql';
import {SearchParam} from '~/global/auth.ts';

const fetchGraphQLBase =
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

const fetchGraphQL: GraphQLFetch = async function fetchWithAuth(...args) {
  const result = await fetchGraphQLBase(...args);

  if (result.errors?.some((error) => (error as any).status === 401)) {
    const signInUrl = new URL('/sign-in', location.href);
    signInUrl.searchParams.set(SearchParam.RedirectTo, location.href);
    location.assign(signInUrl.href);
  }

  return result;
};

const App = AsyncComponent.from(() => import('./App.tsx'));

const element = document.querySelector('#app')!;

hydrate(<App fetchGraphQL={fetchGraphQL} />, element);
