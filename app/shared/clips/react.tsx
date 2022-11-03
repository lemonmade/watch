import {useMemo, useEffect} from 'react';
import {
  signal,
  useComputed,
  createOptionalContext,
  createUseContextHook,
  type GraphQLResult,
  type GraphQLOperation,
  type GraphQLVariableOptions,
  PropsWithChildren,
  Signal,
} from '@quilted/quilt';
import {type ExtensionPoint} from '@watching/clips';

import {type ClipsManager} from './manager';
import {type ClipsExtensionPoint} from './extension';
import {type ClipsExtensionFragmentData} from './graphql/ClipsExtensionFragment.graphql';

const ClipsManagerReactContext = createOptionalContext<ClipsManager>();
export const useClipsManager = createUseContextHook(ClipsManagerReactContext);

export function ClipsManagerContext({
  children,
  manager,
}: PropsWithChildren<{manager: ClipsManager}>) {
  return (
    <ClipsManagerReactContext.Provider value={manager}>
      {children}
    </ClipsManagerReactContext.Provider>
  );
}

export function useClips<Point extends ExtensionPoint>(
  point: Point,
  installations: readonly ClipsExtensionFragmentData[] | null | undefined,
): readonly ClipsExtensionPoint<Point>[] {
  const installedClips = useMemo(() => {
    if (installations == null) return [];

    const installedClips: ClipsExtensionPoint<Point>[] = [];

    for (const installation of installations) {
      const {id, target, extension, version} = installation;

      if (target !== point) continue;

      installedClips.push({
        id: `${id}:${point}`,
        target: point,
        extension: {
          id: extension.id,
          name: extension.name,
          app: {
            id: extension.app.id,
            name: extension.app.name,
          },
        },
        installed: {
          script: version.assets[0]!.source,
          version: version.apiVersion as any,
        },
      });
    }

    return installedClips;
  }, [installations, point]);

  const server = useClipsManager().localDevelopment;

  const allClips = useComputed(() => {
    const allLocalClips = server.extensions.value;

    if (allLocalClips.length === 0) return installedClips;

    const localClips: ClipsExtensionPoint<Point>[] = [];

    for (const localClip of allLocalClips) {
      const {id, name, app} = localClip;

      if (!localClip.extends.some(({target}) => target === point)) {
        continue;
      }

      localClips.push({
        id: `${id}:${point}`,
        target: point,
        extension: {
          id,
          name,
          app: {
            id: app.id,
            name: app.name,
          },
        },
        local: {},
      });
    }

    return [...localClips, ...installedClips];
  }, [server, point, installedClips]);

  return allClips.value;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
