import {useMemo, useEffect} from 'preact/hooks';
import {signal, useComputed, type Signal} from '@quilted/quilt/signals';
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
import {type ClipsExtensionFragmentData} from './graphql/ClipsExtensionFragment.graphql';

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
  installations: readonly ClipsExtensionFragmentData[] | null | undefined,
  ...optionsArg: Point extends ExtensionPointWithOptions
    ? [OptionsForExtensionPoint<Point>]
    : [never?]
): readonly ClipsExtensionPoint<Point>[] {
  const [options] = optionsArg;

  const manager = useClipsManager();
  const server = manager.localDevelopment;

  const installedClips = useMemo(() => {
    if (installations == null) return [];

    const installedClips: ClipsExtensionPoint<Point>[] = [];

    for (const installation of installations) {
      const {
        id,
        target,
        extension,
        version,
        settings,
        liveQuery,
        loading,
        translations,
      } = installation;

      if (target !== point) continue;

      installedClips.push({
        id: `${id}:${point}`,
        target: point,
        manager,
        extension: {
          id: extension.id,
          name: extension.name,
          app: {
            id: extension.app.id,
            name: extension.app.name,
          },
        },
        installed: {
          source: 'installed',
          target: point,
          extension: {id: extension.id},
          script: {url: version.assets[0]!.source},
          version: version.apiVersion.toLowerCase() as any,
          settings: settings ?? undefined,
          liveQuery: liveQuery ?? undefined,
          loadingUi: loading?.ui?.html,
          translations: translations ?? undefined,
          options: options as any,
        },
      });
    }

    return installedClips;
  }, [installations, point, options]);

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
        manager,
        extension: {
          id,
          name,
          app: {
            id: app.id,
            name: app.name,
          },
        },
        local: {
          source: 'local',
          target: point,
          extension: {id},
          options: options as any,
        },
      });
    }

    if (localClips.length === 0) return installedClips;

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
