import {useEffect, useState} from 'react';
import type {ReactNode, ContextType} from 'react';
import {createGraphQL, createHttpFetch} from '@quilted/quilt';
// eslint-disable-next-line import/no-extraneous-dependencies
import {useInitialUrl} from '@quilted/react-router';

import {LocalDevelopmentClipsContext} from 'utilities/clips';

import localDevelopmentOrchestratorQuery from './graphql/LocalDevelopmentOrchestratorQuery.graphql';

export function LocalDevelopmentOrchestrator({
  children,
}: {
  children?: ReactNode;
}) {
  const [extensions, setExtensions] = useState<
    ContextType<typeof LocalDevelopmentClipsContext>
  >([]);
  const url = useInitialUrl();

  useEffect(() => {
    let valid = true;

    const devParam = url.searchParams.get('dev');
    if (devParam == null) return;

    (async () => {
      try {
        const devUrl = new URL(devParam);
        const graphql = createGraphQL({
          fetch: createHttpFetch({uri: devUrl.href}),
        });

        const {data, error} = await graphql.query(
          localDevelopmentOrchestratorQuery,
        );

        if (error) {
          // eslint-disable-next-line no-console
          console.error(error);
        }

        if (!valid || data == null) return;

        const {app} = data;

        setExtensions(
          app.extensions.map((extension) => {
            return {
              id: extension.id,
              name: extension.name,
              version: 'unstable',
              script: extension.assets[0].source,
              socketUrl: extension.socketUrl ?? undefined,
            };
          }),
        );
      } catch {
        // intentional noop
      }
    })();

    return () => {
      valid = false;
    };
  }, [url]);

  return (
    <LocalDevelopmentClipsContext.Provider value={extensions}>
      {children}
    </LocalDevelopmentClipsContext.Provider>
  );
}
