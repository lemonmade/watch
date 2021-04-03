import {useMemo} from 'react';
import {createGraphQL, createHttpFetch, App as QuiltApp} from '@quilted/quilt';
import {Canvas} from '@lemon/zest';

import {Head, Http, LocalDevelopmentOrchestrator, Routes} from './foundation';

export default function App() {
  const graphql = useMemo(
    () =>
      createGraphQL({
        fetch: createHttpFetch({
          uri: 'https://watch.lemon.tools/api/graphql',
        }),
      }),
    [],
  );

  return (
    <QuiltApp graphql={graphql} urlIsExternal={urlIsExternal}>
      <Canvas>
        <Http />
        <Head />
        <LocalDevelopmentOrchestrator>
          <Routes />
        </LocalDevelopmentOrchestrator>
      </Canvas>
    </QuiltApp>
  );
}

function urlIsExternal(url: URL, currentUrl: URL) {
  return (
    url.origin !== currentUrl.origin ||
    url.pathname.startsWith('/internal/auth')
  );
}
