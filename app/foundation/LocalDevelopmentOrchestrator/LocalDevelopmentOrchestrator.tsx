import {ReactNode, useMemo} from 'react';
import {useEffect} from 'react';
import {atom, useSetAtom} from 'jotai';
import {} from 'jotai/utils';

import {useInitialUrl} from '@quilted/quilt';
import {
  createThread,
  createThreadAbortSignal,
  targetFromBrowserWebSocket,
  type Thread,
} from '@quilted/quilt/threads';
import type {ThreadAbortSignal} from '@quilted/quilt/threads';

import {
  LocalDevelopmentServerContext,
  type LocalDevelopmentServer,
} from '~/shared/clips';
import {createResolvablePromise} from '~/shared/promises';

import localDevelopmentOrchestratorQuery from './graphql/LocalDevelopmentOrchestratorQuery.graphql';

interface ThreadApi {
  query<Data, Variables>(
    query: string,
    options?: {variables?: Variables; signal?: ThreadAbortSignal},
  ): AsyncGenerator<{data?: Data}, void, void>;
}

const LOCAL_STORAGE_KEY = 'localDevelopment';

export function LocalDevelopmentOrchestrator({
  children,
}: {
  children?: ReactNode;
}) {
  const initialUrl = useInitialUrl();

  const developmentServer = useMemo(() => {
    const developmentServerUrl = getDevelopmentServerUrl(initialUrl);

    if (developmentServerUrl == null) return null;

    return createLocalDevelopmentServer(developmentServerUrl);
  }, [initialUrl]);

  useEffect(() => {
    if (developmentServer == null) return;

    const abort = new AbortController();

    developmentServer.start({signal: abort.signal});

    return () => {
      abort.abort();
    };
  }, [developmentServer]);

  return (
    <LocalDevelopmentServerContext.Provider value={developmentServer}>
      {developmentServer && (
        <ExtensionPoller developmentServer={developmentServer} />
      )}
      {children}
    </LocalDevelopmentServerContext.Provider>
  );
}

function ExtensionPoller({
  developmentServer,
}: {
  developmentServer: LocalDevelopmentServer;
}) {
  const setExtensions = useSetAtom(developmentServer.extensions);

  useEffect(() => {
    const abort = new AbortController();

    (async () => {
      for await (const {data} of developmentServer.query(
        localDevelopmentOrchestratorQuery,
      )) {
        if (data == null) continue;

        setExtensions(
          data.app.extensions.flatMap((extension) => {
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
  }, [developmentServer, setExtensions]);

  return null;
}

function createLocalDevelopmentServer(url: URL): LocalDevelopmentServer {
  const threadPromise = createResolvablePromise<{thread: Thread<ThreadApi>}>();
  const extensions: LocalDevelopmentServer['extensions'] = atom<readonly any[]>(
    [],
  );

  const query: LocalDevelopmentServer['query'] = async function* query(
    graphql,
    {signal, variables} = {},
  ) {
    const {thread} = await threadPromise.promise;

    const results = thread.query(graphql.source, {
      variables,
      signal: signal && createThreadAbortSignal(signal),
    }) as AsyncGenerator<any>;

    for await (const result of results) {
      yield result;
    }
  };

  return {
    query,
    url: new URL(url),
    start() {
      if (threadPromise.resolved || threadPromise.rejected) return;

      try {
        const socket = new WebSocket(url.href);
        const target = targetFromBrowserWebSocket(socket);
        const thread = createThread<Record<string, never>, ThreadApi>(target);

        globalThis.requestIdleCallback?.(() => {
          persistLocalDevelopmentServerUrl(url);
        });

        threadPromise.resolve({thread});
      } catch (error) {
        threadPromise.reject(error);
      }
    },
    extensions,
  };
}

const VALID_PROTOCOLS = new Set(['ws:', 'wss:']);

function getDevelopmentServerUrl(initialUrl?: URL): URL | undefined {
  const connectParam = initialUrl?.searchParams.get('connect');

  if (connectParam == null) return getPersistedLocalDevelopmentServerUrl();

  try {
    // TODO handle errors in parsing/ connecting
    const localDevelopmentConnectUrl = new URL(connectParam);

    if (!VALID_PROTOCOLS.has(localDevelopmentConnectUrl.protocol)) {
      return undefined;
    }

    return localDevelopmentConnectUrl;
  } catch (error) {
    return undefined;
  }
}

function persistLocalDevelopmentServerUrl(url: URL) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({url: url.href}));
}

function getPersistedLocalDevelopmentServerUrl() {
  try {
    const {url} = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? '{}');
    return url && new URL(url);
  } catch {
    return undefined;
  }
}
