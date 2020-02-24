import React from 'react';
import {ApolloProvider} from '@apollo/react-hooks';
import ApolloClient, {
  InMemoryCache,
  IntrospectionFragmentMatcher,
} from 'apollo-boost';
// import {Route} from '@quilted/quilt';

import {Frame} from './components';
import {Watching} from './features';

interface Props {}

const client = createApolloClient();

export default function App({}: Props) {
  return (
    <ApolloProvider client={client}>
      <Frame
        actions={[
          {content: 'Watching', to: '/'},
          {content: 'Search', to: '/search'},
        ]}
      >
        <Watching />
      </Frame>
    </ApolloProvider>
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
