import React, {useMemo} from 'react';
import {
  GraphQLContext,
  createGraphQL,
  createHttpFetch,
  Router,
  Route,
  AutoHeadingGroup,
} from '@quilted/quilt';

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

export default function App({url}: {url?: URL}) {
  const graphql = useMemo(
    () =>
      createGraphQL({
        fetch: createHttpFetch({uri: 'https://api.lemon.tools/watch'}),
      }),
    [],
  );

  return (
    <Router url={url}>
      <AutoHeadingGroup>
        <GraphQLContext.Provider value={graphql}>
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
            <Route match="/" render={() => <Watching />} />
            <Route match="/subscriptions" render={() => <Subscriptions />} />
            <Route match="/settings" render={() => <Settings />} />
            <Route match="/search" render={() => <Search />} />
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
        </GraphQLContext.Provider>
      </AutoHeadingGroup>
    </Router>
  );
}
