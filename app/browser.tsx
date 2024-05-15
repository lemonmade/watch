if (process.env.NODE_ENV === 'development') {
  await import('preact/debug');
}

import '@quilted/quilt/globals';

import {hydrate} from 'preact';

import Env from '@quilted/quilt/env';
import {Browser, BrowserContext} from '@quilted/quilt/browser';
import {createGraphQLFetch, type GraphQLFetch} from '@quilted/quilt/graphql';
import {createPerformance} from '@quilted/quilt/performance';

import {SearchParam} from '~/global/auth.ts';

import {App} from './App.tsx';

const browser = new Browser();

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

const performance = createPerformance();

performance.on('navigation', async (navigation) => {
  if (Env.MODE === 'development') {
    console.log('Navigation');
    console.log(navigation);
    return;
  }

  const requestData = JSON.stringify({
    navigations: [navigation.toJSON()],
  });

  if (typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon('/internal/metrics/navigation', requestData);
  } else {
    await fetch('/internal/metrics/navigation', {
      method: 'POST',
      body: requestData,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
});

const element = document.querySelector('#app')!;

hydrate(
  <BrowserContext browser={browser}>
    <App context={{fetchGraphQL}} />
  </BrowserContext>,
  element,
);
