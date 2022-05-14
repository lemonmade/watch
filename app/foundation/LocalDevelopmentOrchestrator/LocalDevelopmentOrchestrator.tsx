import {useEffect, useState} from 'react';
import type {ReactNode, ContextType} from 'react';
import {useInitialUrl} from '@quilted/quilt';
import {createThread, targetFromBrowserWebSocket} from '@lemonmade/threads';

import {LocalDevelopmentClipsContext} from 'utilities/clips';

import localDevelopmentOrchestratorQuery from './graphql/LocalDevelopmentOrchestratorQuery.graphql';
import type {LocalDevelopmentOrchestratorQueryData} from './graphql/LocalDevelopmentOrchestratorQuery.graphql';

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
    const abort = new AbortController();
    const {signal} = abort;

    const connectParam = url!.searchParams.get('connect');
    if (connectParam == null) return;

    // TODO handle errors in parsing/ connecting
    const localDevelopmentConnectUrl = new URL(connectParam);

    if (localDevelopmentConnectUrl.protocol !== 'ws:') return;

    const socket = new WebSocket(localDevelopmentConnectUrl.href);
    const target = targetFromBrowserWebSocket(socket);
    const thread = createThread<
      Record<string, never>,
      {
        query<Data = Record<string, unknown>>(
          query: string,
        ): AsyncGenerator<Data, void, void>;
      }
    >(target);

    const results = thread.call.query(localDevelopmentOrchestratorQuery.source);

    (async () => {
      for await (const result of results) {
        // TODO: abort the GraphQL query too
        if (signal.aborted) return;

        setExtensions(
          (
            (result as any).data as LocalDevelopmentOrchestratorQueryData
          ).app.extensions.flatMap((extension) => {
            if (extension.__typename !== 'ClipsExtension') return [];

            return {
              id: extension.id,
              name: extension.name,
              version: 'unstable',
              script:
                // TODO
                extension.build.__typename === 'ExtensionBuildSuccess'
                  ? extension.build.assets[0]!.source
                  : '',
            };
          }),
        );
      }
    })();

    return () => {
      abort.abort();
    };
  }, [url]);

  return (
    <LocalDevelopmentClipsContext.Provider value={extensions}>
      {children}
    </LocalDevelopmentClipsContext.Provider>
  );
}
