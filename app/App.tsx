import {useMemo} from 'react';
import {QueryClient, QueryClientProvider} from 'react-query';

import {
  useRoutes,
  useNavigate,
  createGraphQLHttpFetch,
  Router,
  AppContext,
  GraphQLContext,
} from '@quilted/quilt';
import {HtmlAttributes} from '@quilted/quilt/html';
import type {GraphQLFetch, PropsWithChildren} from '@quilted/quilt';
import {Canvas} from '@lemon/zest';

import {SearchParam} from '~/global/auth';

import {Head, Http, Extensions, Frame} from './foundation';

import {Start} from './features/Start';
import {CreateAccount} from './features/CreateAccount';
import {Goodbye} from './features/Goodbye';
import {Watching, FinishedWatching} from './features/Watching';
import {Series, RandomSeries} from './features/Series';
import {Subscriptions} from './features/Subscriptions';
import {WatchThrough, RandomWatchThrough} from './features/WatchThrough';
import {Apps} from './features/Apps';
import {Search} from './features/Search';
import {SignIn} from './features/SignIn';
import {SignedOut} from './features/SignedOut';
import {Account} from './features/Account';
import {WatchLater} from './features/WatchLater';
import {
  Developer,
  Apps as DevelopedApps,
  AccessTokens,
  AuthenticateCli,
  Console,
} from './features/Developer';
import {ComponentLibrary} from './features/Internal';

const fetch = createGraphQLHttpFetch({
  credentials: 'include',
  uri: '/api/graphql',
});

export default function App() {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            refetchInterval: false,
            refetchOnWindowFocus: true,
          },
        },
      }),
    [],
  );

  return (
    <AppContext>
      <HtmlAttributes lang="en" dir="ltr" />
      <QueryClientProvider client={queryClient}>
        <Router isExternal={urlIsExternal}>
          <GraphQL>
            <Canvas>
              <Http />
              <Head />
              <Extensions>
                <Routes />
              </Extensions>
            </Canvas>
          </GraphQL>
        </Router>
      </QueryClientProvider>
    </AppContext>
  );
}

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
            {match: 'finished', render: () => <FinishedWatching />},
            {match: 'watch-later', render: () => <WatchLater />},
            {match: 'me', render: () => <Account />},
            {
              match: 'developer',
              children: [
                {match: '/', render: () => <Developer />},
                {match: 'apps', render: () => <DevelopedApps />},
                {match: 'access-tokens', render: () => <AccessTokens />},
                {match: 'cli/authenticate', render: () => <AuthenticateCli />},
                {match: 'console', render: () => <Console />},
              ],
            },
            {match: 'apps', render: () => <Apps />},
            {
              match: 'subscriptions',
              render: () => <Subscriptions />,
            },
            {match: 'search', render: () => <Search />},
            {
              match: 'series',
              children: [
                {
                  match: '.random',
                  render: () => <RandomSeries />,
                },
                {
                  match: /\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/,
                  render: ({matched}) => (
                    <Series id={`gid://watch/Series/${matched}`} />
                  ),
                },
                {
                  match: /[\w-]+/,
                  render: ({matched}) => <Series handle={matched} />,
                },
              ],
            },
            {
              match: 'watchthrough',
              children: [
                {
                  match: '.random',
                  render: () => <RandomWatchThrough />,
                },
                {
                  match: /[\w-]+/,
                  renderPrefetch: () => <WatchThrough.Preload />,
                  render: ({matched}) => (
                    <WatchThrough id={`gid://watch/WatchThrough/${matched}`} />
                  ),
                },
              ],
            },
          ],
        },
        {
          match: 'internal',
          children: [{match: 'components', render: () => <ComponentLibrary />}],
        },
      ],
      [],
    ),
  );
}

function GraphQL({children}: PropsWithChildren) {
  const navigate = useNavigate();
  const fetchGraphQL = useMemo<GraphQLFetch>(
    () =>
      async function fetchWithAuth(...args) {
        // TODO why doesn’t this type-check...
        // @ts-expect-error "excessively deep"...
        const result = await fetch(...args);

        if (result.errors?.some((error) => (error as any).status === 401)) {
          navigate((currentUrl) => {
            const signInUrl = new URL('/sign-in', currentUrl);
            signInUrl.searchParams.set(SearchParam.RedirectTo, currentUrl.href);
            return signInUrl;
          });
        }

        return result;
      },
    [navigate],
  );

  return <GraphQLContext fetch={fetchGraphQL}>{children}</GraphQLContext>;
}

function urlIsExternal(url: URL, currentUrl: URL) {
  return (
    url.origin !== currentUrl.origin ||
    url.pathname.startsWith('/internal/auth') ||
    url.pathname.startsWith('/api')
  );
}
