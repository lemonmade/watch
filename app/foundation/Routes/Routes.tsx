import {useMemo} from 'react';
import {useRoutes} from '@quilted/quilt';
import {NotFound} from '@quilted/quilt/http';

import {Watching} from '../../features/Watching';
import {Series} from '../../features/Series';
import {Subscriptions} from '../../features/Subscriptions';
import {WatchThrough} from '../../features/WatchThrough';
import {Settings} from '../../features/Settings';
import {Search} from '../../features/Search';
import {Login} from '../../features/Login';
import {Profile} from '../../features/Profile';
import {Developer} from '../../features/Developer';

import {Frame} from '../Frame';

export function Routes() {
  return useRoutes(
    useMemo<Parameters<typeof useRoutes>[0]>(
      () => [
        {match: 'login', render: () => <Login />},
        {
          match: 'app',
          render: ({children}) => <Frame>{children}</Frame>,
          children: [
            {match: '/', render: () => <Watching />},
            {match: 'me', render: () => <Profile />},
            {match: 'developer', render: () => <Developer />},
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
        {
          render: () => <NotFound />,
        },
      ],
      [],
    ),
  );
}
