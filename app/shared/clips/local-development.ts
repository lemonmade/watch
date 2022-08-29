import {createContext, useEffect, useMemo} from 'react';
import {signal, type Signal} from '@preact/signals';
import {type ExtensionPoint} from '@watching/clips';
import {
  createUseContextHook,
  type GraphQLOperation,
  type GraphQLResult,
  type GraphQLVariableOptions,
} from '@quilted/quilt';

export interface LocalExtension {
  readonly id: string;
  readonly name: string;
}

export interface LocalDevelopmentServer {
  readonly url: URL;
  readonly extensions: Signal<readonly LocalExtension[]>;
  start(options?: {signal?: AbortSignal}): void;
  query<Data, Variables>(
    operation: GraphQLOperation<Data, Variables>,
    options?: {signal?: AbortSignal} & GraphQLVariableOptions<Variables>,
  ): AsyncGenerator<{data?: Data}, void, void>;
}

export const LocalDevelopmentServerContext =
  createContext<LocalDevelopmentServer | null>(null);

export const useLocalDevelopmentServer = createUseContextHook(
  LocalDevelopmentServerContext,
);

const EMPTY_EXTENSIONS = Object.freeze([]);

export function useLocalDevelopmentClips<T extends ExtensionPoint>(
  _extensionPoint: T,
) {
  const localDevelopmentServer = useLocalDevelopmentServer({required: false});
  return localDevelopmentServer?.extensions.value ?? EMPTY_EXTENSIONS;
}

export function useLocalDevelopmentServerQuery<Data, Variables>(
  query: GraphQLOperation<Data, Variables>,
  options?: GraphQLVariableOptions<Variables>,
) {
  const server = useLocalDevelopmentServer();
  const resultSignal = useMemo(
    () =>
      signal<
        | (Pick<GraphQLResult<Data>, 'data' | 'errors'> & {loading: false})
        | {loading: true; data?: never; errors?: never}
      >({loading: true}),
    [],
  );

  useEffect(() => {
    const abort = new AbortController();

    (async () => {
      for await (const result of server.query(query, {
        signal: abort.signal,
        variables: options?.variables as any,
      })) {
        resultSignal.value = {...result, loading: false};
      }
    })();

    return () => {
      abort.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server, resultSignal, query, JSON.stringify(options?.variables)]);

  return resultSignal.value;
}
