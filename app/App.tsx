import {useMemo} from 'react';
import {QueryClient, QueryClientProvider} from 'react-query';

import {
  useNavigate,
  createGraphQLHttpFetch,
  Router,
  AppContext,
  GraphQLContext,
} from '@quilted/quilt';
import type {GraphQLFetch, PropsWithChildren} from '@quilted/quilt';
import {Canvas} from '@lemon/zest';

import {SearchParam} from '~/global/auth';

import {Head, Http, LocalDevelopmentOrchestrator, Routes} from './foundation';

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
      <QueryClientProvider client={queryClient}>
        <Router isExternal={urlIsExternal}>
          <GraphQL>
            <Canvas>
              <Http />
              <Head />
              <LocalDevelopmentOrchestrator>
                <Routes />
              </LocalDevelopmentOrchestrator>
            </Canvas>
          </GraphQL>
        </Router>
      </QueryClientProvider>
    </AppContext>
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
    url.pathname.startsWith('/internal/auth')
  );
}
