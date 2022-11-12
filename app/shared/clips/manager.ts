import {createRenderer} from '@watching/thread-render';

import {type Api} from '@watching/clips';
import {
  signal,
  createEmitter,
  type Signal,
  type GraphQLOperation,
  type GraphQLResult,
  type GraphQLVariableOptions,
  type Emitter,
} from '@quilted/quilt';
import {createThreadSignal} from '@watching/thread-signals';
import {
  createThread,
  createThreadAbortSignal,
  targetFromBrowserWebSocket,
  type Thread,
  type ThreadAbortSignal,
} from '@quilted/quilt/threads';

import {createResolvablePromise} from '../promises';

import {
  type ExtensionPoint,
  type ClipsExtension,
  type ClipsExtensionPointInstance,
  type ClipsExtensionPointInstanceOptions,
  type ClipsExtensionPointInstanceContext,
} from './extension';
import {
  type ExtensionPointDefinitions,
  type ExtensionPointDefinitionContext,
} from './extension-points';
import {createSandbox} from './sandboxes';
import localClipsExtensionsQuery from './graphql/LocalClipsExtensionsQuery.graphql';
import {createLiveQueryRunner} from './live-query';

export interface ClipsManager {
  readonly extensionPoints: ExtensionPointDefinitions;
  readonly localDevelopment: ClipsLocalDevelopmentServer;
  fetchInstance<Point extends ExtensionPoint>(
    options: ClipsExtensionPointInstanceOptions<Point>,
  ): ClipsExtensionPointInstance<Point>;
}

export interface ClipsLocalDevelopmentServer {
  readonly url: Signal<URL | undefined>;
  readonly connected: Signal<boolean>;
  readonly extensions: Signal<readonly ClipsLocalDevelopmentServerExtension[]>;
  readonly on: Emitter<ClipsLocalDevelopmentServerEventMap>['on'];
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
  const instances = new Map<string, ClipsExtensionPointInstance<any>>();
  const localDevelopment = createLocalDevelopmentServer();

  return {
    extensionPoints,
    localDevelopment,
    fetchInstance,
  };

  function fetchInstance<Point extends ExtensionPoint>(
    options: ClipsExtensionPointInstanceOptions<Point>,
  ): ClipsExtensionPointInstance<Point> {
    const cacheKey = JSON.stringify({
      version: options.version,
      extension: options.extension.id,
      script: options.script,
      options: options.options,
    });

    const cached = instances.get(cacheKey);
    if (cached) return cached;

    const extensionPoint = extensionPoints[options.target];

    const settings = signal(JSON.parse(options.settings ?? '{}'));
    const liveQuery = createLiveQueryRunner(
      options.liveQuery,
      (helpers) => extensionPoint.query(options.options as never, helpers),
      {
        context: appContext,
        signal: new AbortController().signal,
      },
    );

    const renderer = createRenderer<ClipsExtensionPointInstanceContext<Point>>({
      context({signal}) {
        return {
          settings,
          liveQuery,
          sandbox: createSandbox({signal}),
          components: extensionPoint.components() as any,
        };
      },
      async prepare({context: {sandbox, liveQuery}}) {
        await Promise.all([
          sandbox.load(options.script.url, options.version),
          liveQuery.run(),
        ]);
      },
      async render({signal, receiver, context}) {
        const {settings, liveQuery, components, sandbox} = context;

        const api: Api<Point> = {
          target: options.target,
          version: options.version,
          settings: createThreadSignal(settings, {signal}),
          query: createThreadSignal(liveQuery.result, {signal}),
        };

        await sandbox.render(
          options.target,
          receiver.receive,
          Object.keys(components),
          api as any,
        );
      },
    });

    instances.set(cacheKey, renderer);

    return renderer;
  }
}
interface ClipsLocalDevelopmentServerThreadApi {
  query<Data, Variables>(
    query: string,
    options?: {variables?: Variables; signal?: ThreadAbortSignal},
  ): AsyncGenerator<{data?: Data}, void, void>;
}

function createLocalDevelopmentServer(): ClipsLocalDevelopmentServer {
  const threadPromise = createResolvablePromise<{
    thread: Thread<ClipsLocalDevelopmentServerThreadApi>;
  }>();

  const url: ClipsLocalDevelopmentServer['url'] = signal(undefined);
  const emitter = createEmitter<ClipsLocalDevelopmentServerEventMap>();
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
    on: emitter.on,
  };

  async function connect(newUrl: URL) {
    connected.value = false;
    url.value = new URL(newUrl);

    emitter.emit('connect:start');

    try {
      const socket = new WebSocket(newUrl.href);
      const target = targetFromBrowserWebSocket(socket);
      const thread = createThread<
        Record<string, never>,
        ClipsLocalDevelopmentServerThreadApi
      >(target);

      threadPromise.resolve({thread});
      emitter.emit('connect:end');

      queryLocalExtensions();
    } catch (error) {
      threadPromise.reject(error);
      emitter.emit('connect:error');
      emitter.emit('connect:end');

      throw error;
    }
  }

  async function* queryWithThread(
    thread: Thread<ClipsLocalDevelopmentServerThreadApi>,
    ...args: Parameters<ClipsLocalDevelopmentServer['query']>
  ) {
    const [graphql, options] = args;

    const signal = options?.signal;
    const variables = options?.variables;

    const results = thread.query(graphql.source, {
      variables,
      signal: signal && createThreadAbortSignal(signal),
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
