import type {RenderableProps} from 'preact';
import {useMemo} from 'preact/hooks';
import {Suspense} from 'preact/compat';
import {QueryClient} from '@tanstack/react-query';
import {ReactQueryContext} from '@quilted/react-query';

import {
  useRoutes,
  useRouter,
  Redirect,
  Routing,
  RoutePreloading,
  type RouteDefinition,
} from '@quilted/quilt/navigate';
import {useSerialized} from '@quilted/quilt/browser';
import {Localization} from '@quilted/quilt/localize';
import {GraphQLContext} from '@quilted/quilt/graphql';
import {PerformanceContext} from '@quilted/quilt/performance';
import {Serialize} from '@quilted/quilt/server';
import {Canvas} from '@lemon/zest';

import {toGid} from '~/shared/graphql.ts';
import {SearchParam} from '~/global/auth.ts';

import {Frame} from './foundation/frame.ts';
import {HTML} from './foundation/html.ts';

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

import {EXTENSION_POINTS} from './clips.ts';

import {
  useAppContext,
  AppContextReact,
  type AppContext as AppContextType,
} from './shared/context';
import {createClipsManager, ClipsLocalDevelopment} from './shared/clips';

export interface AppProps {
  context: Pick<AppContextType, 'fetchGraphQL' | 'user'>;
}

export function App({context}: AppProps) {
  return (
    <Routing isExternal={urlIsExternal}>
      <RoutePreloading>
        <AppContext context={context}>
          <HTML>
            <PerformanceContext>
              <Localization locale="en-CA">
                <Canvas>
                  <Suspense fallback={null}>
                    <Routes />
                  </Suspense>
                </Canvas>
              </Localization>
            </PerformanceContext>
          </HTML>
        </AppContext>
      </RoutePreloading>
    </Routing>
  );
}

const routes: RouteDefinition[] = [
  {
    match: '/',
    render: <Start />,
    renderPreload: <Start.Preload />,
  },
  {
    match: 'sign-in',
    children: [
      {
        match: '/',
        render: <SignIn />,
        renderPreload: <SignIn.Preload />,
      },
      {
        match: 'check-your-email',
        render: <CheckYourEmail />,
        renderPreload: <CheckYourEmail.Preload />,
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
        renderPreload: <CreateAccount.Preload />,
      },
      {
        match: 'check-your-email',
        render: <CheckYourEmail />,
        renderPreload: <CheckYourEmail.Preload />,
      },
    ],
  },
  {match: 'goodbye', render: <Goodbye />},
  {
    match: 'app',
    render: ({children}) => (
      <Authenticated>
        <Frame>{children}</Frame>
      </Authenticated>
    ),
    renderPreload: <Frame.Preload />,
    children: [
      {
        match: '/',
        render: <Watching />,
        renderPreload: <Watching.Preload />,
      },
      {
        match: 'finished',
        render: <FinishedWatching />,
        renderPreload: <FinishedWatching.Preload />,
      },
      {
        match: 'watch-later',
        render: <WatchLater />,
        renderPreload: <WatchLater.Preload />,
      },
      {
        match: ['me', 'my'],
        children: [
          {
            match: '/',
            render: <Account />,
            renderPreload: <Account.Preload />,
          },
          {
            match: 'payment',
            render: <Payment />,
            renderPreload: <Payment.Preload />,
          },
        ],
      },
      {
        match: 'developer',
        children: [
          {
            match: '/',
            render: <Developer />,
            renderPreload: <Developer.Preload />,
          },
          {
            match: 'apps',
            render: <DevelopedApps />,
            renderPreload: <DevelopedApps.Preload />,
          },
          {
            match: 'access-tokens',
            render: <AccessTokens />,
            renderPreload: <AccessTokens.Preload />,
          },
          {
            match: 'cli',
            children: [
              {
                match: 'authenticate',
                render: <AuthenticateCli />,
                renderPreload: <AuthenticateCli.Preload />,
              },
              {
                match: 'created-account',
                render: <CreatedAccountFromCli />,
                renderPreload: <CreatedAccountFromCli.Preload />,
              },
            ],
          },
          {
            match: 'console',
            render: <Console />,
            renderPreload: <Console.Preload />,
          },
        ],
      },
      {
        match: 'apps',
        render: <Apps />,
        renderPreload: <Apps.Preload />,
      },
      {
        match: 'subscriptions',
        render: <Subscriptions />,
        renderPreload: <Subscriptions.Preload />,
      },
      {
        match: 'search',
        render: <Search />,
        renderPreload: <Search.Preload />,
      },
      {
        match: 'series',
        children: [
          {
            match: '.random',
            render: <RandomSeries />,
          },
          {
            match: /\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/,
            render: ({matched}) => <Series id={toGid(matched, 'Series')} />,
            renderPreload: <Series.Preload />,
          },
          {
            match: /[\w-]+/,
            render: ({matched}) => <Series handle={matched} />,
            renderPreload: <Series.Preload />,
          },
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
            match: /[\w-]+/,
            render: ({matched}) => (
              <WatchThrough id={toGid(matched, 'WatchThrough')} />
            ),
            renderPreload: <WatchThrough.Preload />,
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

export interface AppContextProps
  extends Pick<AppContextType, 'user' | 'fetchGraphQL'> {}

interface SerializedAppContext {
  user: NonNullable<AppContextType['user']>;
}

export function AppContext({children, context}: RenderableProps<AppProps>) {
  const router = useRouter();
  const serializedContext = useSerialized<SerializedAppContext | undefined>(
    'AppContext',
  );

  const fullContext = useMemo<AppContextType>(() => {
    const user = serializedContext?.user ?? context.user;

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: Infinity,
          refetchInterval: false,
          refetchOnWindowFocus: true,
        },
      },
    });

    const clipsManager = user
      ? createClipsManager(
          {user, graphql: context.fetchGraphQL, router},
          EXTENSION_POINTS,
        )
      : undefined;

    return {
      ...serializedContext,

      user,
      queryClient,
      clipsManager,
      ...context,
    };
  }, [serializedContext, router, context]);

  const contextToSerialize: SerializedAppContext | undefined = context.user
    ? {user: context.user}
    : undefined;

  return (
    <AppContextReact.Provider value={fullContext}>
      <ReactQueryContext client={fullContext.queryClient}>
        <GraphQLContext fetch={fullContext.fetchGraphQL}>
          {children}
        </GraphQLContext>
      </ReactQueryContext>
      {fullContext.clipsManager && (
        <ClipsLocalDevelopment manager={fullContext.clipsManager} />
      )}
      {contextToSerialize && (
        <Serialize id="AppContext" value={contextToSerialize} />
      )}
    </AppContextReact.Provider>
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

function urlIsExternal(url: URL, currentUrl: URL) {
  return (
    url.origin !== currentUrl.origin ||
    url.pathname.startsWith('/internal/auth') ||
    url.pathname.startsWith('/api')
  );
}
