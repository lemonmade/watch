import {useMemo} from 'react';
import {useRoutes} from '@quilted/quilt';

import {Start} from '../../features/Start';
import {CreateAccount} from '../../features/CreateAccount';
import {Goodbye} from '../../features/Goodbye';
import {Watching} from '../../features/Watching';
import {Series} from '../../features/Series';
import {Subscriptions} from '../../features/Subscriptions';
import {WatchThrough} from '../../features/WatchThrough';
import {Settings} from '../../features/Settings';
import {Apps} from '../../features/Apps';
import {Search} from '../../features/Search';
import {SignIn} from '../../features/SignIn';
import {SignedOut} from '../../features/SignedOut';
import {Account} from '../../features/Account';
import {
  Developer,
  Apps as DevelopedApps,
  AccessTokens,
  AuthenticateCli,
} from '../../features/Developer';

import {Frame} from '../Frame';

export function Routes() {
  return useRoutes(
    useMemo<Parameters<typeof useRoutes>[0]>(
      () => [
        {match: '/', render: () => <Start />},
        {match: 'sign-in', render: () => <SignIn />},
        {match: 'signed-out', render: () => <SignedOut />},
        {match: 'create-account', render: () => <CreateAccount />},
        {match: 'goodbye', render: () => <Goodbye />},
        {
          match: 'app',
          render: ({children}) => <Frame>{children}</Frame>,
          children: [
            {match: '/', render: () => <Watching />},
            {match: 'me', render: () => <Account />},
            {
              match: 'developer',
              children: [
                {match: '/', render: () => <Developer />},
                {match: 'apps', render: () => <DevelopedApps />},
                {match: 'access-tokens', render: () => <AccessTokens />},
                {match: 'cli/authenticate', render: () => <AuthenticateCli />},
              ],
            },
            {match: 'apps', render: () => <Apps />},
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
