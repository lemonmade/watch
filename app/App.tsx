import {useMemo} from 'react';
import {createGraphQL, createHttpFetch, App as QuiltApp} from '@quilted/quilt';

import '@lemon/zest/core.css';

import {
  Frame,
  Head,
  Http,
  LocalDevelopmentOrchestrator,
  Routes,
} from './foundation';

export default function App() {
  const graphql = useMemo(
    () =>
      createGraphQL({
        fetch: createHttpFetch({uri: 'https://api.lemon.tools/watch'}),
      }),
    [],
  );

  return (
    <QuiltApp graphql={graphql}>
      <Http />
      <Head />
      <LocalDevelopmentOrchestrator>
        <Frame>
          <Routes />
        </Frame>
      </LocalDevelopmentOrchestrator>
    </QuiltApp>
  );
}
