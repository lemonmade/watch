import {useMemo} from 'react';
import {useRoutes} from '@quilted/quilt';

import {
  Watching,
  Series,
  Subscriptions,
  WatchThrough,
  Settings,
  Search,
  Login,
} from '../../features';
import {Frame} from '../Frame';

export function Routes() {
  return useRoutes(
    useMemo<Parameters<typeof useRoutes>[0]>(
      () => [
        {match: 'login', render: () => <Login />},
        {
          render: ({children}) => <Frame>{children}</Frame>,
          children: [
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
                  renderPrefetch: () => <WatchThrough.Prefetch />,
                  render: ({matched}) => (
                    <WatchThrough id={`gid://watch/WatchThrough/${matched}`} />
                  ),
                },
              ],
            },
          ],
        },
      ],
      [],
    ),
  );
}
