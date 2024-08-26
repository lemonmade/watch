import type {RenderableProps} from 'preact';
import {Suspense} from 'preact/compat';

import {ReactQueryContext} from '@quilted/react-query';

import {
  route,
  useRoutes,
  Redirect,
  Navigation,
  type RouteDefinition,
} from '@quilted/quilt/navigation';
import {Localization} from '@quilted/quilt/localize';
import {GraphQLContext} from '@quilted/quilt/graphql';
import {PerformanceContext} from '@quilted/quilt/performance';
import {Canvas} from '@lemon/zest';

import {toGid} from '~/shared/graphql.ts';
import {SearchParam} from '~/global/auth.ts';

import {HTML} from './foundation/html.ts';
import {Frame} from './foundation/Frame.ts';

import {Start} from './features/Start.ts';
import {Watching, FinishedWatching} from './features/Watching.ts';
import {WatchThrough, RandomWatchThrough} from './features/WatchThrough.ts';
import {Series, RandomSeries} from './features/Series.ts';
import {Subscriptions} from './features/Subscriptions.ts';
import {Apps} from './features/Apps.ts';
import {Search} from './features/Search.ts';
import {SignIn, SignedOut} from './features/Authentication.ts';
import {
  Account,
  Payment,
  Goodbye,
  CreateAccount,
  CheckYourEmail,
} from './features/Account.ts';
import {WatchLater} from './features/WatchLater.ts';
import {
  Developer,
  Apps as DevelopedApps,
  AccessTokens,
  AuthenticateCli,
  CreatedAccountFromCli,
  Console,
} from './features/Developer.ts';
import {ComponentLibrary} from './features/Internal.ts';
import {Admin} from './features/Admin.ts';

import {
  useAppContext,
  AppContextReact,
  type AppContext as AppContextType,
} from './shared/context';
import {ClipsLocalDevelopment} from './shared/clips';

export interface AppProps {
  context: AppContextType;
}

export default function App({context}: AppProps) {
  return (
    <AppContext context={context}>
      <HTML>
        <Canvas>
          <Suspense fallback={null}>
            <Routes />
          </Suspense>
        </Canvas>
      </HTML>
    </AppContext>
  );
}

const routes: RouteDefinition[] = [
  {
    match: '/',
    render: <Start />,
  },
  {
    match: 'sign-in',
    children: [
      {
        match: '/',
        render: <SignIn />,
      },
      {
        match: 'check-your-email',
        render: <CheckYourEmail />,
      },
    ],
  },
  {
    match: 'signed-out',
    render: <SignedOut />,
  },
  {
    match: 'create-account',
    children: [
      {
        match: '/',
        render: <CreateAccount />,
      },
      {
        match: 'check-your-email',
        render: <CheckYourEmail />,
      },
    ],
  },
  {match: 'goodbye', render: <Goodbye />},
  {
    match: 'app',
    render: (children) => (
      <Authenticated>
        <Frame>
          <Suspense fallback={null}>{children}</Suspense>
        </Frame>
      </Authenticated>
    ),
    children: [
      {
        match: '/',
        render: <Watching />,
      },
      {
        match: 'finished',
        render: <FinishedWatching />,
      },
      {
        match: 'watch-later',
        render: <WatchLater />,
      },
      {
        match: ['me', 'my'],
        children: [
          {
            match: '/',
            render: <Account />,
          },
          {
            match: 'payment',
            render: <Payment />,
          },
        ],
      },
      {
        match: 'developer',
        children: [
          {
            match: '/',
            render: <Developer />,
          },
          {
            match: 'apps',
            render: <DevelopedApps />,
          },
          {
            match: 'access-tokens',
            render: <AccessTokens />,
          },
          {
            match: 'cli',
            children: [
              {
                match: 'authenticate',
                render: <AuthenticateCli />,
              },
              {
                match: 'created-account',
                render: <CreatedAccountFromCli />,
              },
            ],
          },
          {
            match: 'console',
            render: <Console />,
          },
        ],
      },
      {
        match: 'apps',
        render: <Apps />,
      },
      {
        match: 'subscriptions',
        render: <Subscriptions />,
      },
      {
        match: 'search',
        render: <Search />,
      },
      {
        match: 'series',
        children: [
          {
            match: '.random',
            render: <RandomSeries />,
          },
          route(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/, {
            render: (_, {matched}) => (
              <Series id={toGid(matched[0], 'Series')} />
            ),
          }),
          route(':handle', {
            render: (_, {matched}) => <Series handle={matched} />,
          }),
        ],
      },
      {
        match: ['watching', 'watch-through', 'watchthrough'],
        children: [
          {
            match: '.random',
            render: <RandomWatchThrough />,
          },
          {
            match: ':handle',
            render: (_, {matched}) => (
              <WatchThrough id={toGid(matched, 'WatchThrough')} />
            ),
          },
        ],
      },
      {match: 'admin', render: <Admin />},
    ],
  },
  {
    match: 'internal',
    children: [{match: 'components', render: <ComponentLibrary />}],
  },
];

export function Routes() {
  return useRoutes(routes);
}

export function AppContext({children, context}: RenderableProps<AppProps>) {
  return (
    <PerformanceContext>
      <Localization locale="en-CA">
        <Navigation router={context.router}>
          <AppContextReact.Provider value={context}>
            <ReactQueryContext client={context.queryClient}>
              <GraphQLContext
                fetch={context.graphql.fetch}
                cache={context.graphql.cache}
              >
                <Suspense fallback={null}>{children}</Suspense>
              </GraphQLContext>
            </ReactQueryContext>
            {context.clipsManager && (
              <ClipsLocalDevelopment manager={context.clipsManager} />
            )}
          </AppContextReact.Provider>
        </Navigation>
      </Localization>
    </PerformanceContext>
  );
}

function Authenticated({children}: RenderableProps<{}>) {
  const {user} = useAppContext();

  if (user == null) {
    return <Redirect to={createSignInRedirect} />;
  }

  return <>{children}</>;
}

function createSignInRedirect(currentUrl: URL) {
  const signInUrl = new URL('/sign-in', currentUrl);
  signInUrl.searchParams.set(SearchParam.RedirectTo, currentUrl.href);
  return signInUrl;
}
