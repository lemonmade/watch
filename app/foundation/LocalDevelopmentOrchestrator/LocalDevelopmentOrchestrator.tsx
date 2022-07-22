import {ReactNode, useMemo} from 'react';
import {useEffect, useState} from 'react';

import {useInitialUrl} from '@quilted/quilt';
import {
  createThread,
  createThreadAbortSignal,
  targetFromBrowserWebSocket,
} from '@quilted/quilt/threads';
import type {ThreadAbortSignal} from '@quilted/quilt/threads';

import {LocalDevelopmentServerContext} from '~/shared/clips';
import type {LocalDevelopmentServer} from '~/shared/clips';

import localDevelopmentOrchestratorQuery from './graphql/LocalDevelopmentOrchestratorQuery.graphql';
import type {LocalDevelopmentOrchestratorQueryData} from './graphql/LocalDevelopmentOrchestratorQuery.graphql';

export function LocalDevelopmentOrchestrator({
  children,
}: {
  children?: ReactNode;
}) {
  const [partialServer, setPartialServer] = useState<Omit<
    LocalDevelopmentServer,
    'extensions'
  > | null>(null);

  const [extensions, setExtensions] = useState<
    LocalDevelopmentServer['extensions']
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
        query<Data, Variables>(
          query: string,
          options?: {variables?: Variables; signal?: ThreadAbortSignal},
        ): AsyncGenerator<{data?: Data}, void, void>;
      }
    >(target);

    const query: LocalDevelopmentServer['query'] = async function* query(
      query,
      {signal, variables} = {},
    ) {
      const results = thread.query(query.source, {
        variables,
        signal: signal && createThreadAbortSignal(signal),
      }) as AsyncGenerator<any>;

      for await (const result of results) {
        yield result;
      }
    };

    setPartialServer({query, url: localDevelopmentConnectUrl});

    const results = query(localDevelopmentOrchestratorQuery, {
      signal,
    });

    (async () => {
      for await (const result of results) {
        setExtensions(
          (
            (result as any).data as LocalDevelopmentOrchestratorQueryData
          ).app.extensions.flatMap((extension) => {
            if (extension.__typename !== 'ClipsExtension') return [];

            return {
              id: extension.id,
              name: extension.name,
            };
          }),
        );
      }
    })();

    return () => {
      abort.abort();
    };
  }, [url]);

  const developmentServer = useMemo<LocalDevelopmentServer | null>(
    () => partialServer && {...partialServer, extensions},
    [partialServer, extensions],
  );

  return (
    <LocalDevelopmentServerContext.Provider value={developmentServer}>
      {children}
    </LocalDevelopmentServerContext.Provider>
  );
}
