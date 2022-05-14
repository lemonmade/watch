import {createContext} from 'react';
import type {ExtensionPoint} from '@watching/clips';
import {createUseContextHook} from '@quilted/quilt';
import type {GraphQLOperation} from '@quilted/quilt';

export interface LocalExtension {
  readonly id: string;
  readonly name: string;
}

export interface LocalDevelopmentServer {
  readonly url: URL;
  readonly extensions: readonly LocalExtension[];
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
  return localDevelopmentServer?.extensions ?? [];
}
