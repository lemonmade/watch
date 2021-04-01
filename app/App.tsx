import {useMemo} from 'react';
import {createGraphQL, createHttpFetch, App as QuiltApp} from '@quilted/quilt';

import {Head, Http, LocalDevelopmentOrchestrator, Routes} from './foundation';

export default function App() {
  const graphql = useMemo(
    () =>
      createGraphQL({
        fetch: createHttpFetch({
          uri: 'https://watch-test.lemon.tools/api/graphql',
        }),
      }),
    [],
  );

  return (
    <QuiltApp graphql={graphql}>
      <Http />
      <Head />
      <LocalDevelopmentOrchestrator>
        <Routes />
      </LocalDevelopmentOrchestrator>
    </QuiltApp>
  );
}
