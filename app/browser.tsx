import 'preact/debug';

import '@quilted/quilt/globals';
import {hydrate} from 'preact';
import {Browser, BrowserContext} from '@quilted/quilt/browser';
import {Router} from '@quilted/quilt/navigation';
import {createPerformance} from '@quilted/quilt/performance';
import {
  GraphQLCache,
  createGraphQLFetch,
  type GraphQLFetch,
} from '@quilted/quilt/graphql';

import Env from 'quilt:module/env';

import type {AppContext} from '~/shared/context.ts';
import {SearchParam} from '~/global/auth.ts';
import {createClipsManager} from '~/shared/clips.ts';

import App from './App.tsx';
import {EXTENSION_POINTS} from './clips.ts';

const browser = new Browser();

const user = browser.serializations.get('app.user');

const router = new Router(browser.request.url, {
  isExternal(url, currentURL) {
    return (
      url.origin !== currentURL.origin ||
      url.pathname.startsWith('/internal/auth') ||
      url.pathname.startsWith('/api')
    );
  },
});

const performance = createPerformance();

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

const element = document.querySelector('#app')!;

const context = {
  user,
  router,
  graphql: {cache: new GraphQLCache(), fetch: fetchGraphQL},
  performance,
  clipsManager: user
    ? createClipsManager(
        {user, graphql: fetchGraphQL, router},
        EXTENSION_POINTS,
      )
    : undefined,
} satisfies AppContext;

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

Object.assign(globalThis, {app: {context}});

hydrate(
  <BrowserContext browser={browser}>
    <App context={context} />
  </BrowserContext>,
  element,
);
