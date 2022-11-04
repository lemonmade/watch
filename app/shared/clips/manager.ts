import {type Api} from '@watching/clips';
import {
  signal,
  createEmitter,
  anyAbortSignal,
  type Signal,
  type GraphQLOperation,
  type GraphQLResult,
  type GraphQLVariableOptions,
  type Emitter,
} from '@quilted/quilt';
import {createThreadSignal, type ThreadSignal} from '@watching/thread-signals';
import {
  createThread,
  createThreadAbortSignal,
  acceptThreadAbortSignal,
  targetFromBrowserWebSocket,
  type Thread,
  type ThreadAbortSignal,
} from '@quilted/quilt/threads';

import {createResolvablePromise} from '../promises';

import {
  type Version,
  type ExtensionPoint,
  type ClipsExtension,
  type ClipsExtensionPointInstance,
  type ClipsExtensionPointInstanceOptions,
  type ClipsExtensionPointInstanceContext,
  type ClipsExtensionPointInstanceEventMap,
  type ClipsExtensionPointInstanceTiming,
  type ClipsExtensionSandbox,
  type ClipsExtensionSandboxInstance,
  type ClipsExtensionSandboxInstanceTiming,
  type ClipsExtensionSandboxInstanceEventMap,
} from './extension';
import {EXTENSION_POINTS} from './extension-points';
import {createSandbox, type Sandbox} from './sandboxes';
import {createRemoteReceiver} from './receiver';
import localClipsExtensionsQuery from './graphql/LocalClipsExtensionsQuery.graphql';
import {createLiveQueryRunner} from './live-query';

export interface ClipsManager {
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

type Writable<T> = {-readonly [K in keyof T]: T[K]};

export function createClipsManager(): ClipsManager {
  const instances = new Map<string, ClipsExtensionPointInstance<any>>();
  const sandboxes = new Map<string, ClipsExtensionSandboxInstance>();
  const localDevelopment = createLocalDevelopmentServer();

  return {
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

    const sandboxOptions = {
      version: options.version,
      script: options.script.url,
    };
    const sandboxCacheKey = JSON.stringify(sandboxOptions);
    let sandbox = sandboxes.get(sandboxCacheKey);

    if (sandbox == null) {
      sandbox = createClipsExtensionSandboxInstance(sandboxOptions);
      sandboxes.set(sandboxCacheKey, sandbox);
    }

    const abort = new AbortController();
    const state: ClipsExtensionPointInstance<any>['state'] = signal('stopped');
    const receiver: ClipsExtensionPointInstance<any>['receiver'] = signal(
      createRemoteReceiver(),
    );
    const timings: Signal<Writable<ClipsExtensionPointInstanceTiming>> = signal(
      {},
    );
    const emitter = createEmitter<ClipsExtensionPointInstanceEventMap>();
    let currentRender: {abort: AbortController} | undefined;

    const extensionPoint = EXTENSION_POINTS[options.target];
    const components: ClipsExtensionPointInstance<any>['components'] =
      extensionPoint.components() as any;

    const liveQuery = createLiveQueryRunner(
      options.liveQuery,
      (extensionPoint as any).query(options.options),
      {signal: abort.signal},
    );

    const context: ClipsExtensionPointInstanceContext<Point> = {
      settings: signal(JSON.parse(options.settings ?? '{}')),
      liveQuery,
    };

    const api: Api<Point> = {
      target: options.target,
      version: options.version,
      settings: createInstanceThreadSignal(context.settings),
      query: createInstanceThreadSignal(context.liveQuery.result),
    };

    const instance: ClipsExtensionPointInstance<any> = {
      id: cacheKey,
      options,
      context,
      api,
      components,
      sandbox,
      state,
      receiver,
      timings,
      signal: abort.signal,
      on: emitter.on,
      render,
      get rendered() {
        return currentRender ? {signal: currentRender.abort.signal} : undefined;
      },
      restart,
    };

    instances.set(cacheKey, instance);

    return instance;

    function createInstanceThreadSignal<T>(signal: Signal<T>): ThreadSignal<T> {
      const threadSignal = createThreadSignal(signal);

      return {
        get initial() {
          return threadSignal.initial;
        },
        set: threadSignal.set,
        start(subscriber, {signal: threadAbortSignal} = {}) {
          const abortSignal =
            threadAbortSignal && acceptThreadAbortSignal(threadAbortSignal);

          const finalAbortSignal =
            abortSignal && currentRender?.abort.signal
              ? anyAbortSignal(abortSignal, currentRender.abort.signal)
              : abortSignal ?? currentRender?.abort.signal;

          return threadSignal.start(subscriber, {signal: finalAbortSignal});
        },
      };
    }

    async function restart() {
      currentRender?.abort.abort();
      currentRender = undefined;
      receiver.value = createRemoteReceiver();
      await sandbox!.restart();
      await render();
    }

    async function render(_: {signal?: AbortSignal} = {}) {
      currentRender = {abort: new AbortController()};
      await Promise.all([sandbox!.start(), context.liveQuery.run()]);
      await sandbox!.run(async (sandbox) => {
        await sandbox.render(
          options.target,
          receiver.value.receive,
          Object.keys(instance.components),
          api as any,
        );
      });
    }
  }
}

function createClipsExtensionSandboxInstance({
  script,
  version,
}: {
  script: string;
  version: Version;
}): ClipsExtensionSandboxInstance {
  let startId = 0;
  let loadPromise: Promise<void> | undefined;
  let sandbox: Sandbox | undefined;
  let abort: AbortController;

  const state: ClipsExtensionSandboxInstance['state'] = signal('stopped');
  const timings: Signal<Writable<ClipsExtensionSandboxInstanceTiming>> = signal(
    {},
  );
  const emitter = createEmitter<ClipsExtensionSandboxInstanceEventMap>();

  const sandboxProxy: ClipsExtensionSandbox = {
    render: (...args) => (call as any)('render', ...args),
    getResourceTimingEntries: (...args) =>
      call('getResourceTimingEntries', ...args),
  };

  const sandboxController: ClipsExtensionSandboxInstance = {
    timings,
    get id() {
      return String(startId);
    },
    state,
    start,
    stop,
    restart,
    on: emitter.on,
    run: async (runner) => runner(sandboxProxy),
  };

  return sandboxController;

  type PromiseType<T> = T extends PromiseLike<infer U> ? U : T;

  async function call<K extends keyof Sandbox>(
    key: K,
    ...args: Parameters<Sandbox[K]>
  ): Promise<PromiseType<ReturnType<Sandbox[K]>>> {
    if (sandbox == null) {
      throw new Error('tried to call a method but no sandbox exists');
    }

    if (loadPromise) {
      await loadPromise;
    }

    const result = await (sandbox[key] as any)(...args);
    return result;
  }

  async function start() {
    if (sandbox) return;

    const currentStartId = startId;

    abort = new AbortController();
    state.value = 'starting';
    timings.value = {start: Date.now()};
    sandbox = createSandbox({
      signal: abort.signal,
    }) as any;

    state.value = 'loading';
    timings.value = {...timings.peek(), loadStart: Date.now()};
    emitter.emit('load:start');
    loadPromise = sandbox!.load(script, version);

    await loadPromise;

    if (currentStartId === startId) {
      loadPromise = undefined;
      timings.value = {...timings.peek(), loadStart: Date.now()};
      emitter.emit('load:end');
    }
  }

  function stop() {
    sandbox = undefined;
    loadPromise = undefined;
    startId += 1;
    timings.value = {};
    state.value = 'stopped';
    abort.abort();
    emitter.emit('stop');
  }

  function restart() {
    stop();
    return start();
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
