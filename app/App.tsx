import {useMemo} from 'react';
import {QueryClient, QueryClientProvider} from 'react-query';

import {
  useRoutes,
  useNavigate,
  createGraphQLHttpFetch,
  Router,
  AppContext as QuiltContext,
  Redirect,
  GraphQLContext,
  type RouteDefinition,
  type GraphQLFetch,
  type PropsWithChildren,
} from '@quilted/quilt';
import {HtmlAttributes, useSerialized} from '@quilted/quilt/html';
import {Canvas} from '@lemon/zest';

import {SearchParam} from '~/global/auth';

import {Head, Http, Frame} from './foundation';

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

import {
  useAppContext,
  AppContextReact,
  type AppContext as AppContextType,
} from './shared/context';
import {createClipsManager, ClipsLocalDevelopment} from './shared/clips';

const fetch = createGraphQLHttpFetch({
  credentials: 'include',
  uri: '/api/graphql',
});

export default function App(props: AppContextProps) {
  return (
    <QuiltContext>
      <Router isExternal={urlIsExternal}>
        <AppContext {...props}>
          <Http />
          <Head />
          <HtmlAttributes lang="en" dir="ltr" />
          <Canvas>
            <Routes />
          </Canvas>
        </AppContext>
      </Router>
    </QuiltContext>
  );
}

const routes: RouteDefinition[] = [
  {match: '/', render: () => <Start />},
  {match: 'sign-in', render: () => <SignIn />},
  {match: 'signed-out', render: () => <SignedOut />},
  {match: 'create-account', render: () => <CreateAccount />},
  {match: 'goodbye', render: () => <Goodbye />},
  {
    match: 'app',
    render: ({children}) => (
      <Authenticated>
        <Frame>{children}</Frame>
      </Authenticated>
    ),
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
            renderPreload: () => <WatchThrough.Preload />,
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
];

export function Routes() {
  return useRoutes(routes);
}

export interface AppContextProps extends Pick<AppContextType, 'user'> {}

export function AppContext({
  user: explicitUser,
  children,
}: PropsWithChildren<AppContextProps>) {
  const navigate = useNavigate();
  const serializedContext = useSerialized('AppContext', () => ({
    user: explicitUser,
  }));

  const context = useMemo<AppContextType>(() => {
    const user = serializedContext?.user ?? explicitUser;

    const fetchGraphQL: GraphQLFetch = async function fetchWithAuth(...args) {
      // @ts-expect-error "excessively deep" ...
      const result = await fetch(...args);

      if (result.errors?.some((error) => (error as any).status === 401)) {
        navigate(createSignInRedirect);
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

    const clipsManager = user ? createClipsManager({user}) : undefined;

    return {
      ...serializedContext,

      user,
      fetchGraphQL,
      queryClient,
      clipsManager,
    };
  }, [serializedContext, navigate, explicitUser]);

  return (
    <AppContextReact.Provider value={context}>
      <QueryClientProvider client={context.queryClient}>
        <GraphQLContext fetch={context.fetchGraphQL}>{children}</GraphQLContext>
      </QueryClientProvider>
      {context.clipsManager && (
        <ClipsLocalDevelopment manager={context.clipsManager} />
      )}
    </AppContextReact.Provider>
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
