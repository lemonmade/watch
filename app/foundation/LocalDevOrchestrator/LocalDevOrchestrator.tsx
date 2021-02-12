import {useEffect, useState} from 'react';
import type {ReactNode, ContextType} from 'react';
import {createGraphQL, createHttpFetch} from '@quilted/quilt';
// eslint-disable-next-line import/no-extraneous-dependencies
import {useInitialUrl} from '@quilted/react-router';

import {LocalDevExtensionsContext} from 'utilities/local-dev';

import localDevOrchestratorQuery from './graphql/LocalDevOrchestratorQuery.graphql';

export function LocalDevOrchestrator({children}: {children?: ReactNode}) {
  const [extensions, setExtensions] = useState<
    ContextType<typeof LocalDevExtensionsContext>
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

        const {data} = await graphql.query(localDevOrchestratorQuery);

        if (!valid || data == null) return;

        const {app} = data;

        setExtensions(
          app.extensions.map((extension) => {
            return {
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
    <LocalDevExtensionsContext.Provider value={extensions}>
      {children}
    </LocalDevExtensionsContext.Provider>
  );
}
