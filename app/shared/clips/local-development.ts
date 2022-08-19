import {createContext, useMemo} from 'react';
import {atom, useAtomValue, type PrimitiveAtom} from 'jotai';
import {type ExtensionPoint} from '@watching/clips';
import {createUseContextHook, type GraphQLOperation} from '@quilted/quilt';

export interface LocalExtension {
  readonly id: string;
  readonly name: string;
}

export interface LocalDevelopmentServer {
  readonly url: URL;
  readonly extensions: PrimitiveAtom<readonly LocalExtension[]>;
  start(options?: {signal?: AbortSignal}): void;
  query<Data, Variables>(
    operation: GraphQLOperation<Data, Variables>,
    options?: {signal?: AbortSignal; variables?: Variables},
  ): AsyncGenerator<{data?: Data}, void, void>;
}

export const LocalDevelopmentServerContext =
  createContext<LocalDevelopmentServer | null>(null);

export const useLocalDevelopmentServer = createUseContextHook(
  LocalDevelopmentServerContext,
);

export function useLocalDevelopmentClips<T extends ExtensionPoint>(
  _extensionPoint: T,
) {
  const localDevelopmentServer = useLocalDevelopmentServer({required: false});
  const extensionsAtom = useMemo(
    () =>
      atom((get) => {
        if (localDevelopmentServer)
          return get(localDevelopmentServer.extensions);

        return [];
      }),
    [localDevelopmentServer],
  );

  return useAtomValue(extensionsAtom);
}
