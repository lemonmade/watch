import {createRenderer} from '@watching/thread-render';

import {type ApiCore} from '@watching/clips';
import {signal, type Signal} from '@quilted/quilt/signals';
import {EventEmitter} from '@quilted/quilt/events';
import {
  createGraphQLFetch,
  type GraphQLOperation,
  type GraphQLResult,
  type GraphQLVariableOptions,
} from '@quilted/quilt/graphql';
import {
  ThreadSignal,
  ThreadAbortSignal,
  ThreadBrowserWebSocket,
  type Thread,
  type ThreadAbortSignalSerialization,
} from '@quilted/quilt/threads';

import {createResolvablePromise} from '../promises.ts';

import {
  type ExtensionPoint,
  type ClipsExtension,
  type ClipsExtensionPointInstance,
  type ClipsExtensionPointInstanceContext,
  type ClipsExtensionPointInstanceOptions,
  type ClipsExtensionPointLocalInstanceOptions,
  type ClipsExtensionPointInstalledInstanceOptions,
} from './extension.ts';
import {
  type ExtensionPointDefinitions,
  type ExtensionPointDefinitionContext,
} from './extension-points.ts';
import {createSandbox} from './sandbox.ts';
import {createLiveQueryRunner} from './live-query.ts';
import {createMutateRunner} from './mutate.ts';

import localClipsExtensionsQuery from './graphql/LocalClipsExtensionsQuery.graphql';
import localClipQuery, {
  type LocalClipQueryData,
} from './graphql/LocalClipQuery.graphql';

export interface ClipsManager {
  readonly extensionPoints: ExtensionPointDefinitions;
  readonly localDevelopment: ClipsLocalDevelopmentServer;
  fetchInstance<Point extends ExtensionPoint>(
    options: ClipsExtensionPointInstanceOptions<Point>,
  ): ClipsExtensionPointInstance<Point>;
}

export interface ClipsLocalDevelopmentServer
  extends Pick<
    EventEmitter<ClipsLocalDevelopmentServerEventMap>,
    'on' | 'once'
  > {
  readonly url: Signal<URL | undefined>;
  readonly connected: Signal<boolean>;
  readonly extensions: Signal<readonly ClipsLocalDevelopmentServerExtension[]>;
  connect(url: URL): Promise<void>;
  query<Data, Variables>(
    operation: GraphQLOperation<Data, Variables>,
    options?: {signal?: AbortSignal} & GraphQLVariableOptions<Variables>,
  ): AsyncGenerator<GraphQLResult<Data>, void, void>;
}

export interface ClipsLocalDevelopmentServerExtension extends ClipsExtension {
  readonly extends: readonly {readonly target: ExtensionPoint}[];
}

export interface ClipsLocalDevelopmentServerEventMap {
  'connect:start': void;
  'connect:end': void;
  'connect:error': void;
}

export function createClipsManager(
  appContext: ExtensionPointDefinitionContext,
  extensionPoints: ExtensionPointDefinitions,
): ClipsManager {
  const renderers = new Map<
    Map<string, unknown>,
    ClipsExtensionPointInstance<any>
  >();
  const localDevelopment = createLocalDevelopmentServer();

  return {
    extensionPoints,
    localDevelopment,
    fetchInstance,
  };

  function getFromCache<Point extends ExtensionPoint>(
    options: ClipsExtensionPointInstanceOptions<Point> & {_id: string},
  ) {
    const entries = Object.entries(options);

    for (const [cacheKey, instance] of renderers.entries()) {
      if (cacheKey.size !== entries.length) continue;

      if (
        entries.every(([key, value]) =>
          defaultIsEqual(cacheKey.get(key), value),
        )
      ) {
        return instance as ClipsExtensionPointInstance<Point>;
      }
    }
  }

  function fetchInstance<Point extends ExtensionPoint>(
    options: ClipsExtensionPointInstanceOptions<Point>,
  ): ClipsExtensionPointInstance<Point> {
    const cacheKey: ClipsExtensionPointInstanceOptions<Point> & {_id: string} =
      {
        _id: `${options.source}:${options.extension.id}:${options.target}`,
        ...(options.options as any),
      };

    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const renderer =
      options.source === 'local'
        ? createLocalInstance(options)
        : createInstalledInstance(options);

    renderers.set(new Map(Object.entries(cacheKey)), renderer);

    return renderer;
  }

  function createInstalledInstance<Point extends ExtensionPoint>(
    options: ClipsExtensionPointInstalledInstanceOptions<Point>,
  ) {
    const extensionPoint = extensionPoints[options.target];

    const extensionGraphQL = createGraphQLFetch({
      url: ({name}) => {
        const url = new URL(
          '/api/graphql/clips',
          appContext.router.currentRequest.url,
        );

        if (name) url.searchParams.set('name', name);
        url.searchParams.set('extension', options.extension.id);

        return url;
      },
      credentials: 'include',
    });

    const extensionContext: ExtensionPointDefinitionContext = {
      ...appContext,
      graphql: extensionGraphQL,
    };

    const settings = signal(JSON.parse(options.settings ?? '{}'));
    const liveQuery = createLiveQueryRunner(
      options.liveQuery,
      (helpers) => extensionPoint.query(options.options as never, helpers),
      {
        context: extensionContext,
        signal: new AbortController().signal,
      },
    );
    const mutate = createMutateRunner(
      (helpers) =>
        extensionPoint.mutate?.(options.options as never, helpers) ?? {},
      {
        context: extensionContext,
      },
    );
    const loadingUi = signal(options.loadingUi);

    const renderer = createRenderer<ClipsExtensionPointInstanceContext<Point>>({
      context({signal}) {
        return {
          settings,
          liveQuery,
          loadingUi,
          mutate,
          sandbox: createSandbox({signal}),
          components: extensionPoint.components(),
          graphql: extensionGraphQL,
        };
      },
      async prepare({context: {sandbox, liveQuery}}) {
        await Promise.all([
          sandbox.imports.load(options.script.url, options.version),
          liveQuery.run(),
        ]);
      },
      async render({signal, receiver, context}) {
        const {settings, liveQuery, mutate, sandbox} = context;

        const api: ApiCore<Point> = {
          target: options.target,
          version: options.version,
          settings: ThreadSignal.serialize(settings, {signal}),
          localize: {locale: 'en', translations: options.translations},
          query: ThreadSignal.serialize(liveQuery.result, {signal}),
          mutate: mutate as any,
        };

        await sandbox.imports.render(
          options.target,
          receiver.connection,
          api as any,
        );
      },
    });

    return renderer;
  }

  function createLocalInstance<Point extends ExtensionPoint>(
    options: ClipsExtensionPointLocalInstanceOptions<Point>,
  ) {
    const extensionPoint = extensionPoints[options.target];

    const extensionGraphQL = createGraphQLFetch({
      url: ({name}) => {
        const url = new URL(
          '/api/graphql/clips',
          appContext.router.currentRequest.url,
        );

        if (name) url.searchParams.set('name', name);
        url.searchParams.set('extension', options.extension.id);

        return url;
      },
      credentials: 'include',
    });

    const extensionContext: ExtensionPointDefinitionContext = {
      ...appContext,
      graphql: extensionGraphQL,
    };

    const events = new EventEmitter<{script: string}>();
    const script = signal<string | undefined>(undefined);
    const translations = signal<string | undefined>(undefined);
    const settings = signal({});
    const liveQuery = createLiveQueryRunner(
      undefined,
      (helpers) => extensionPoint.query(options.options as never, helpers),
      {
        context: extensionContext,
        signal: new AbortController().signal,
      },
    );
    const mutate = createMutateRunner(
      (helpers) =>
        extensionPoint.mutate?.(options.options as never, helpers) ?? {},
      {
        context: extensionContext,
      },
    );
    const loadingUi = signal<string | undefined>(undefined);

    const renderer = createRenderer<ClipsExtensionPointInstanceContext<Point>>({
      context({signal}) {
        return {
          settings,
          liveQuery,
          loadingUi,
          mutate,
          sandbox: createSandbox({signal}),
          components: extensionPoint.components(),
          graphql: extensionGraphQL,
        };
      },
      async prepare({context: {sandbox, liveQuery}}) {
        const localScript = script.value ?? (await events.once('script'));

        await Promise.all([
          sandbox.imports.load(localScript, 'unstable'),
          liveQuery.run(),
        ]);
      },
      async render({signal, receiver, context}) {
        const {settings, liveQuery, sandbox} = context;

        const api: ApiCore<Point> = {
          target: options.target,
          version: 'unstable',
          settings: ThreadSignal.serialize(settings, {signal}),
          localize: {locale: 'en', translations: translations.value},
          query: ThreadSignal.serialize(liveQuery.result, {signal}),
          mutate: mutate as any,
        };

        await sandbox.imports.render(
          options.target,
          receiver.connection,
          api as any,
        );
      },
    });

    pollForUpdates();

    async function pollForUpdates() {
      let lastSuccessfulBuild:
        | LocalClipQueryData.App.ClipsExtension.Build_ExtensionBuildSuccess
        | undefined;

      for await (const result of localDevelopment.query(localClipQuery, {
        signal: renderer.signal,
        variables: {id: options.extension.id},
      })) {
        const clipsExtension = result.data?.app?.clipsExtension;

        if (clipsExtension == null) {
          await renderer.destroy();
          return;
        }

        const build = clipsExtension?.build;
        const translationsJson = clipsExtension?.translations.find(({locale}) =>
          locale.startsWith('en'),
        )?.dictionary;
        const extensionPoint = clipsExtension?.extends.find((extend) => {
          return extend.target === options.target;
        });

        let needsRestart = false;

        if (translations != null) {
          translations.value = translationsJson;
        }

        if (
          build?.__typename === 'ExtensionBuildSuccess' &&
          build.id !== lastSuccessfulBuild?.id
        ) {
          const newScript = build.assets[0]!.source;

          script.value = newScript;
          needsRestart = lastSuccessfulBuild != null;
          lastSuccessfulBuild = build;

          events.emit('script', newScript);
        }

        if (needsRestart) {
          renderer.restart();
        }

        if (extensionPoint) {
          liveQuery.update(extensionPoint.liveQuery?.query ?? undefined);
          loadingUi.value = extensionPoint.loading?.ui?.html;
        }
      }
    }

    return renderer;
  }
}
interface ClipsLocalDevelopmentServerThreadApi {
  query<Data, Variables>(
    query: string,
    options?: {variables?: Variables; signal?: ThreadAbortSignalSerialization},
  ): AsyncGenerator<{data?: Data}, void, void>;
}

function createLocalDevelopmentServer(): ClipsLocalDevelopmentServer {
  const threadPromise = createResolvablePromise<{
    thread: Thread<ClipsLocalDevelopmentServerThreadApi>;
  }>();

  const url: ClipsLocalDevelopmentServer['url'] = signal(undefined);
  const events = new EventEmitter<ClipsLocalDevelopmentServerEventMap>();
  const connected = signal(false);
  const extensions: ClipsLocalDevelopmentServer['extensions'] = signal([]);

  const query: ClipsLocalDevelopmentServer['query'] = async function* query(
    graphql,
    options,
  ) {
    const {thread} = await threadPromise.promise;

    for await (const result of queryWithThread(
      thread,
      graphql,
      options as any,
    )) {
      yield result;
    }
  };

  return {
    url,
    connected,
    query,
    connect,
    extensions,
    on: events.on,
    once: events.once,
  };

  async function connect(newUrl: URL) {
    connected.value = false;
    url.value = new URL(newUrl);

    events.emit('connect:start');

    try {
      const socket = new WebSocket(newUrl.href);
      const thread =
        new ThreadBrowserWebSocket<ClipsLocalDevelopmentServerThreadApi>(
          socket,
        );

      threadPromise.resolve({thread});
      connected.value = true;

      events.emit('connect:end');

      queryLocalExtensions();
    } catch (error) {
      threadPromise.reject(error);
      events.emit('connect:error');
      events.emit('connect:end');

      throw error;
    }
  }

  async function* queryWithThread(
    thread: Thread<ClipsLocalDevelopmentServerThreadApi>,
    ...args: Parameters<ClipsLocalDevelopmentServer['query']>
  ) {
    const [graphql, options] = args;

    const signal = options?.signal;
    const variables = options?.variables as any;

    const results = thread.imports.query(graphql.source, {
      variables,
      signal: signal && ThreadAbortSignal.serialize(signal),
    }) as AsyncGenerator<any>;

    for await (const result of results) {
      yield result;
    }
  }

  async function queryLocalExtensions() {
    for await (const {data} of query(localClipsExtensionsQuery)) {
      if (data == null) continue;

      const newExtensions: ClipsLocalDevelopmentServerExtension[] = [];

      const {app} = data;

      for (const extension of app.extensions) {
        if (extension.__typename !== 'ClipsExtension') continue;

        newExtensions.push({
          id: extension.id,
          name: extension.name,
          app: {
            id: app.id,
            name: app.name,
          },
          extends: extension.extends.map((extend) => {
            return {target: extend.target as ExtensionPoint};
          }),
        });
      }

      extensions.value = newExtensions;
    }
  }
}

function defaultIsEqual(one: unknown, two: unknown): boolean {
  if (one == null || typeof one !== 'object') return one === two;

  if (two == null || typeof two !== 'object') return false;

  if (Array.isArray(one)) {
    if (!Array.isArray(two)) return false;

    return (
      one.length === two.length &&
      one.every((item, index) => defaultIsEqual(item, two[index]))
    );
  }

  const prototypeOne = Object.getPrototypeOf(one);

  if (prototypeOne !== Object.prototype && prototypeOne != null) {
    return one === two;
  }

  const prototypeTwo = Object.getPrototypeOf(two);

  if (prototypeTwo !== Object.prototype && prototypeTwo != null) {
    return false;
  }

  const entriesOne = Object.entries(one);
  const mapTwo = new Map(Object.entries(two));

  return (
    entriesOne.length === mapTwo.size &&
    entriesOne.every(([key, value]) => defaultIsEqual(value, mapTwo.get(key)))
  );
}
