import React from 'react';
import {ApolloProvider} from '@apollo/react-hooks';
import ApolloClient, {
  InMemoryCache,
  IntrospectionFragmentMatcher,
} from 'apollo-boost';
import {Router, Route, AutoHeadingGroup} from '@quilted/quilt';

import '@lemon/zest/core.css';
import './App.css';

import {Frame} from './components';
import {Watching, Series, Subscriptions, WatchThrough} from './features';

const client = createApolloClient();

export default function App() {
  return (
    <Router>
      <AutoHeadingGroup>
        <ApolloProvider client={client}>
          <Frame
            actions={[
              {content: 'Watching', to: '/'},
              {content: 'Search', to: '/search'},
              {content: 'Subscriptions', to: '/subscriptions'},
            ]}
          >
            <Route match="/" render={() => <Watching />} />
            <Route match="/subscriptions" render={() => <Subscriptions />} />
            <Route
              match={/\/series\/[\w-]+$/}
              render={({pathname}) => (
                <Series
                  id={`gid://watch/Series/${pathname.split('/').pop()!}`}
                />
              )}
            />
            <Route
              match={/\/watchthrough\/[\w-]+$/}
              render={({pathname}) => (
                <WatchThrough
                  id={`gid://watch/WatchThrough/${pathname.split('/').pop()!}`}
                />
              )}
            />
          </Frame>
        </ApolloProvider>
      </AutoHeadingGroup>
    </Router>
  );
}

function createApolloClient() {
  return new ApolloClient({
    uri: 'https://api.lemon.tools/watch',
    cache: new InMemoryCache({
      addTypename: true,
      fragmentMatcher: new IntrospectionFragmentMatcher({
        introspectionQueryResultData: {
          __schema: {
            types: [
              {
                kind: 'INTERFACE',
                name: 'Reviewable',
                possibleTypes: [
                  {
                    name: 'Watch',
                  },
                  {
                    name: 'WatchThrough',
                  },
                ],
              },
              {
                kind: 'INTERFACE',
                name: 'Watchable',
                possibleTypes: [
                  {
                    name: 'Episode',
                  },
                ],
              },
              {
                kind: 'UNION',
                name: 'WatchThroughEpisodeAction',
                possibleTypes: [
                  {
                    name: 'Watch',
                  },
                  {
                    name: 'Skip',
                  },
                ],
              },
            ],
          },
        },
      }),
    }),
  });
}
