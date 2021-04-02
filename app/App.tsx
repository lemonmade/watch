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
    <QuiltApp graphql={graphql}>
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
