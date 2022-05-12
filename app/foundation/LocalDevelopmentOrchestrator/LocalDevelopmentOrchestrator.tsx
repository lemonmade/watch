import {useEffect, useState} from 'react';
import type {ReactNode, ContextType} from 'react';
import {useInitialUrl} from '@quilted/quilt';
import {createThread, targetFromBrowserWebSocket} from '@lemonmade/threads';

import {LocalDevelopmentClipsContext} from 'utilities/clips';

import localDevelopmentOrchestratorQuery from './graphql/LocalDevelopmentOrchestratorQuery.graphql';

export function LocalDevelopmentOrchestrator({
  children,
}: {
  children?: ReactNode;
}) {
  const [extensions, _setExtensions] = useState<
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
        query(query: string): AsyncGenerator<Record<string, any>, void, void>;
      }
    >(target);

    const results = thread.call.query(localDevelopmentOrchestratorQuery.source);

    (async () => {
      for await (const result of results) {
        // TODO: abort the GraphQL query too
        if (signal.aborted) return;
        console.log(result);
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
