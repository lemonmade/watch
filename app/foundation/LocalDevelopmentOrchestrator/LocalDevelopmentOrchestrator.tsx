import {useEffect, useState} from 'react';
import type {ReactNode, ContextType} from 'react';
import {createGraphQL, createHttpFetch, useInitialUrl} from '@quilted/quilt';

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

    const buildingParam = url.searchParams.get('building');
    if (buildingParam == null) return;

    (async () => {
      try {
        const localDevelopmentQueryUrl = new URL(buildingParam);
        const graphql = createGraphQL({
          fetch: createHttpFetch({uri: localDevelopmentQueryUrl.href}),
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
