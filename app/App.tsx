import {PropsWithChildren, useMemo} from 'react';
import {
  useNavigate,
  createGraphQL,
  createHttpFetch,
  App as QuiltApp,
  GraphQLContext,
} from '@quilted/quilt';
import {Canvas} from '@lemon/zest';

import {SearchParam} from 'global/utilities/auth';

import {Head, Http, LocalDevelopmentOrchestrator, Routes} from './foundation';

const fetch = createHttpFetch({
  credentials: 'include',
  uri: 'https://watch.lemon.tools/api/graphql',
});

export default function App() {
  return (
    <QuiltApp urlIsExternal={urlIsExternal}>
      <GraphQL>
        <Canvas>
          <Http />
          <Head />
          <LocalDevelopmentOrchestrator>
            <Routes />
          </LocalDevelopmentOrchestrator>
        </Canvas>
      </GraphQL>
    </QuiltApp>
  );
}

// eslint-disable-next-line @typescript-eslint/ban-types
function GraphQL({children}: PropsWithChildren<{}>) {
  const navigate = useNavigate();
  const graphql = useMemo(
    () =>
      createGraphQL({
        async fetch(request, context) {
          try {
            const result = await fetch(request, context);
            return result;
          } catch (error) {
            // There should be a much easier way to do this...
            if (error.status === 401) {
              navigate((currentUrl) => {
                const signInUrl = new URL('/sign-in', currentUrl);
                signInUrl.searchParams.set(
                  SearchParam.RedirectTo,
                  currentUrl.href,
                );
                return signInUrl;
              });
            }

            throw error;
          }
        },
      }),
    [navigate],
  );

  return (
    <GraphQLContext.Provider value={graphql}>
      {children}
    </GraphQLContext.Provider>
  );
}

function urlIsExternal(url: URL, currentUrl: URL) {
  return (
    url.origin !== currentUrl.origin ||
    url.pathname.startsWith('/internal/auth')
  );
}
