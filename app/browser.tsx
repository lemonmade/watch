import 'preact/debug';

import '@quilted/quilt/globals';
import {hydrate, Browser} from '@quilted/quilt/browser';
import {Router} from '@quilted/quilt/navigation';
import {createPerformance} from '@quilted/quilt/performance';

import Env from 'quilt:module/env';

import type {AppContext} from '~/shared/context.ts';
import {ClipsManager} from '~/shared/clips.ts';
import type {User} from '~/shared/user.ts';

import App from './App.tsx';
import {EXTENSION_POINTS} from './clips.ts';
import {GraphQLForBrowser} from './browser/graphql.ts';

const browser = new Browser();

const user = browser.serializations.get<User | undefined>('app.user');

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

const element = document.querySelector('#app')!;

const graphql = new GraphQLForBrowser();

const context = {
  user,
  router,
  graphql,
  performance,
  clipsManager: user
    ? new ClipsManager({user, graphql, router}, EXTENSION_POINTS)
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

Object.assign(globalThis, {app: {context, element}});

hydrate(<App context={context} />, {element, browser});

// Helpers
