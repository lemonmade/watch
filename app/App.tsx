/* eslint-disable import/no-extraneous-dependencies */
import '@quilted/polyfills/base';
import '@quilted/polyfills/fetch';
/* eslint-enable import/no-extraneous-dependencies */

import React, {useMemo, memo} from 'react';
import {
  createGraphQL,
  createHttpFetch,
  useRoutes,
  AutoHeadingGroup,
  App as QuiltApp,
} from '@quilted/quilt';
import {useResponseHeader} from '@quilted/quilt/http';
import {useTitle, useMeta} from '@quilted/quilt/html';

import '@lemon/zest/core.css';
import './App.css';

import {Frame, NavigationList, NavigationListItem} from './components';
import {
  Watching,
  Series,
  Subscriptions,
  WatchThrough,
  Settings,
  Search,
} from './features';

export default function App() {
  const graphql = useMemo(
    () =>
      createGraphQL({
        fetch: createHttpFetch({uri: 'https://api.lemon.tools/watch'}),
      }),
    [],
  );

  return (
    <QuiltApp graphql={graphql}>
      <Http />
      <Head />
      <AutoHeadingGroup>
        <Frame
          renderNavigation={() => (
            <NavigationList>
              <NavigationListItem to="/">Watching</NavigationListItem>
              <NavigationListItem to="/subscriptions">
                Subscriptions
              </NavigationListItem>
              <NavigationListItem to="/search">Search</NavigationListItem>
              <NavigationListItem to="/settings">Settings</NavigationListItem>
            </NavigationList>
          )}
        >
          <Routes />
        </Frame>
      </AutoHeadingGroup>
    </QuiltApp>
  );
}

const Routes = memo(function Routes() {
  return useRoutes(
    useMemo<Parameters<typeof useRoutes>[0]>(
      () => [
        {match: '/', render: () => <Watching />},
        {match: 'subscriptions', render: () => <Subscriptions />},
        {match: 'settings', render: () => <Settings />},
        {match: 'search', render: () => <Search />},
        {
          match: 'series',
          children: [
            {
              match: /[\w-]+/,
              render: ({matched}) => (
                <Series id={`gid://watch/Series/${matched}`} />
              ),
            },
          ],
        },
        {
          match: 'watchthrough',
          children: [
            {
              match: /[\w-]+/,
              render: ({matched}) => (
                <WatchThrough id={`gid://watch/WatchThrough/${matched}`} />
              ),
            },
          ],
        },
      ],
      [],
    ),
  );
});

const Http = memo(function Http() {
  useResponseHeader('Content-Type', 'text/html');
  useResponseHeader('X-Lemon', '1');

  return null;
});

const Head = memo(function Head() {
  useTitle('Watch');

  useMeta({
    name: 'viewport',
    content:
      'width=device-width, initial-scale=1.0, height=device-height, user-scalable=0',
  });

  return null;
});
