import {useMemo, useEffect} from 'preact/hooks';
import {signal, type Signal} from '@quilted/quilt/signals';
import {
  type GraphQLResult,
  type GraphQLOperation,
  type GraphQLVariableOptions,
} from '@quilted/quilt/graphql';
import {type ExtensionPoint} from '@watching/clips';

import {useAppContext} from '~/shared/context.ts';

import {type ClipsManager} from './manager.ts';
import {type ClipsExtensionPoint} from './extension';
import {
  type ExtensionPointWithOptions,
  type OptionsForExtensionPoint,
} from './extension-points';
import {type ClipsExtensionPointFragmentData} from './graphql/ClipsExtensionPointFragment.graphql';

declare module '~/shared/context.ts' {
  interface AppContext {
    readonly clipsManager?: ClipsManager;
  }
}

export function useClipsManager() {
  const {clipsManager} = useAppContext();

  if (clipsManager == null) {
    throw new Error('No clips manager available in the app context');
  }

  return clipsManager;
}

export function useClips<Point extends ExtensionPoint>(
  point: Point,
  clips: readonly ClipsExtensionPointFragmentData[] | null | undefined,
  ...optionsArg: Point extends ExtensionPointWithOptions
    ? [OptionsForExtensionPoint<Point>]
    : [never?]
): readonly ClipsExtensionPoint<Point>[] {
  const [options] = optionsArg;

  const manager = useClipsManager();

  if (clips) manager.addInstalledClips(clips);

  return manager.clipsForExtensionPoint(point, options as any);
}

type ClipsLocalDevelopmentServerGraphQLResult<Data> =
  | (Pick<GraphQLResult<Data>, 'data' | 'errors'> & {loading: false})
  | {loading: true; data?: never; errors?: never};

export function useLocalDevelopmentServerQuerySignal<Data, Variables>(
  query: GraphQLOperation<Data, Variables>,
  options?: GraphQLVariableOptions<Variables>,
): Signal<ClipsLocalDevelopmentServerGraphQLResult<Data>> {
  const server = useClipsManager().localDevelopment;

  const resultSignal = useMemo(
    () =>
      signal<ClipsLocalDevelopmentServerGraphQLResult<Data>>({loading: true}),
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
  }, [server, resultSignal, query, JSON.stringify(options?.variables)]);

  return resultSignal;
}

export function useLocalDevelopmentServerQuery<Data, Variables>(
  query: GraphQLOperation<Data, Variables>,
  options?: GraphQLVariableOptions<Variables>,
) {
  return useLocalDevelopmentServerQuerySignal<Data, Variables>(query, options)
    .value;
}
