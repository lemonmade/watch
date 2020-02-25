import React, {ComponentProps} from 'react';
import {ApolloProvider} from '@apollo/react-hooks';
import ApolloClient, {
  InMemoryCache,
  IntrospectionFragmentMatcher,
} from 'apollo-boost';
import {Route, RemoteRouter} from '@lemon/react-router';

import {Frame} from './components';
import {Watching, Series} from './features';

interface Props {
  router: ComponentProps<typeof RemoteRouter>['router'];
}

const client = createApolloClient();

export default function App({router}: Props) {
  return (
    <RemoteRouter router={router}>
      <ApolloProvider client={client}>
        <Frame
          actions={[
            {content: 'Watching', to: '/'},
            {content: 'Search', to: '/search'},
          ]}
        >
          <Route match="/" render={() => <Watching />} />
          <Route
            match={/\/series\/[\w-]+$/}
            render={({pathname}) => (
              <Series id={`gid://watch/Series/${pathname.split('/').pop()!}`} />
            )}
          />
        </Frame>
      </ApolloProvider>
    </RemoteRouter>
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
