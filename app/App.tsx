import {useMemo} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

import {
  useRoutes,
  useRouter,
  QuiltApp,
  Redirect,
  RoutePreloading,
  type RouteDefinition,
  type PropsWithChildren,
} from '@quilted/quilt';
import {useSerialized} from '@quilted/quilt/html';
import {
  createGraphQLHttpFetch,
  GraphQLContext,
  type GraphQLFetch,
} from '@quilted/quilt/graphql';
import {Canvas} from '@lemon/zest';

import {toGid} from '~/shared/graphql';
import {SearchParam} from '~/global/auth';

import {Head} from './foundation/Head.ts';
import {Http} from './foundation/Http.ts';
import {Metrics} from './foundation/Metrics.ts';
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

import {EXTENSION_POINTS} from './clips.ts';

import {
  useAppContext,
  AppContextReact,
  type AppContext as AppContextType,
} from './shared/context';
import {createClipsManager, ClipsLocalDevelopment} from './shared/clips';

export default function App(props: AppContextProps) {
  return (
    <QuiltApp
      http={<Http />}
      html={<Head />}
      localization="en-CA"
      routing={{isExternal: urlIsExternal}}
    >
      <RoutePreloading>
        <AppContext {...props}>
          <Canvas>
            <Routes />
          </Canvas>
        </AppContext>
      </RoutePreloading>
    </QuiltApp>
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

export interface AppContextProps extends Pick<AppContextType, 'user'> {}

export function AppContext({
  user: explicitUser,
  children,
}: PropsWithChildren<AppContextProps>) {
  const router = useRouter();
  const serializedContext = useSerialized('AppContext', () => ({
    user: explicitUser,
  }));

  const context = useMemo<AppContextType>(() => {
    const user = serializedContext?.user ?? explicitUser;

    const fetch =
      process.env.NODE_ENV === 'production'
        ? createGraphQLHttpFetch({
            method: (operation) =>
              operation.source.startsWith('mutation ') ? 'POST' : 'GET',
            url: (operation) => {
              const url = new URL(`/api/graphql`, router.currentUrl);
              if (operation.name) url.searchParams.set('name', operation.name);
              url.searchParams.set('id', operation.id);
              return url;
            },
            source: false,
            credentials: 'include',
          })
        : createGraphQLHttpFetch({
            url: (operation) => {
              const url = new URL(`/api/graphql`, router.currentUrl);
              if (operation.name) url.searchParams.set('name', operation.name);
              return url;
            },
            credentials: 'include',
          });

    const fetchGraphQL: GraphQLFetch = async function fetchWithAuth(...args) {
      // @ts-expect-error "excessively deep" ...
      const result = await fetch(...args);

      if (result.errors?.some((error) => (error as any).status === 401)) {
        router.navigate(createSignInRedirect);
      }

      return result;
    };

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
          {user, graphql: fetchGraphQL, router},
          EXTENSION_POINTS,
        )
      : undefined;

    return {
      ...serializedContext,

      user,
      fetchGraphQL,
      queryClient,
      clipsManager,
    };
  }, [serializedContext, router, explicitUser]);

  return (
    <Metrics>
      <AppContextReact.Provider value={context}>
        <QueryClientProvider client={context.queryClient}>
          <GraphQLContext fetch={context.fetchGraphQL}>
            {children}
          </GraphQLContext>
        </QueryClientProvider>
        {context.clipsManager && (
          <ClipsLocalDevelopment manager={context.clipsManager} />
        )}
      </AppContextReact.Provider>
    </Metrics>
  );
}

function Authenticated({children}: PropsWithChildren) {
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
