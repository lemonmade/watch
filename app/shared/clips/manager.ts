import {createRenderer, ThreadRenderer} from '@watching/thread-render';

import {type ApiCore} from '@watching/clips';
import {
  computed,
  ReadonlySignal,
  signal,
  type Signal,
} from '@quilted/quilt/signals';
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
  type ClipsExtensionPoint as ClipsExtensionPointType,
  type ClipsExtensionPointInstanceContext,
} from './extension.ts';
import {
  type ExtensionPointDefinitions,
  type ExtensionPointDefinitionContext,
  type OptionsForExtensionPoint,
} from './extension-points.ts';
import {createSandbox} from './sandbox.ts';
import {createLiveQueryRunner} from './live-query.ts';
import {createMutateRunner} from './mutate.ts';

import localClipsExtensionsQuery from './graphql/LocalClipsExtensionsQuery.graphql';
import localClipQuery, {
  type LocalClipQueryData,
} from './graphql/LocalClipQuery.graphql';
import type {ClipsExtensionPointFragmentData} from './graphql/ClipsExtensionPointFragment.graphql';

export interface ClipsManagerType {
  readonly context: ExtensionPointDefinitionContext;
  readonly definitions: ExtensionPointDefinitions;
  readonly localDevelopment: ClipsLocalDevelopmentServer;
  clipsForExtensionPoint<Point extends ExtensionPoint>(
    point: Point,
    options: OptionsForExtensionPoint<Point>,
  ): readonly ClipsExtensionPointType<Point>[];
  addInstalledClips(clips: readonly ClipsExtensionPointFragmentData[]): void;
}

export interface ClipsLocalDevelopmentServerType
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

class ClipsExtensionPointWithOptions<Point extends ExtensionPoint>
  implements ClipsExtensionPointType<Point>
{
  readonly target: Point;
  readonly id: ClipsExtensionPointType<Point>['id'];
  readonly installation: ClipsExtensionPointType<Point>['installation'];
  readonly extension: ClipsExtensionPointType<Point>['extension'];
  readonly options: OptionsForExtensionPoint<Point>;
  readonly manager: ClipsManagerType;

  #installed = signal<ClipsExtensionPointType<Point>['installed']>(undefined);

  get installed() {
    return this.#installed.value;
  }

  #local: ReadonlySignal<ClipsExtensionPointType<Point>['local']>;

  get local() {
    return this.#local.value;
  }

  constructor(
    target: Point,
    options: OptionsForExtensionPoint<Point>,
    {
      manager,
      installed,
      local,
    }: {
      manager: ClipsManagerType;
      installed: Signal<ClipsExtensionPointFragmentData | undefined>;
      local: Signal<ClipsLocalDevelopmentServerExtension | undefined>;
    },
  ) {
    const installedData = installed.peek();
    const localData = local.peek();

    if (localData == null && installedData == null) {
      throw new Error('No data for constructing a clip extension point');
    }

    this.target = target;
    this.manager = manager;
    this.options = options;

    if (installedData) {
      const {id, extensionInstallation} = installedData;
      const {extension} = extensionInstallation;

      this.id = id;
      this.installation = {id: extensionInstallation.id};
      this.extension = {
        id: extension.id,
        name: extension.name,
        app: {
          id: extension.app.id,
          name: extension.app.name,
        },
      };
      this.options = options;
    } else {
      this.id = `${localData!.id}/${target}`;
      this.installation = {id: `${localData!.id}/${target}/LocalInstallation`};
      this.extension = localData!;
    }

    let installedInstance: InstanceType<
      typeof ClipsExtensionPointInstalledInstance<any>
    >;
    this.#installed = computed(() => {
      const installedExtension = installed.value;

      if (installedExtension == null) return undefined;

      installedInstance ??= new ClipsExtensionPointInstalledInstance(
        this,
        installedExtension,
      );
      return installedInstance;
    });

    const createLocalInstance = this.#createLocalInstance.bind(this);

    let localRenderer: ReturnType<typeof createLocalInstance>;
    this.#local = computed(() => {
      const localExtension = local.value;

      if (localExtension == null) return undefined;

      return {
        get renderer() {
          localRenderer ??= createLocalInstance(localExtension);
          return localRenderer;
        },
      };
    });
  }

  #createLocalInstance<Point extends ExtensionPoint>(
    _clip: ClipsLocalDevelopmentServerExtension,
    // extensionPoint: ClipsLocalDevelopmentServerExtension['extends'][number],
  ) {
    const {target, extension, manager, options} = this;
    const extensionPoint = manager.definitions[target];

    const extensionGraphQL = createGraphQLFetch({
      url: ({name}) => {
        const url = new URL(
          '/api/graphql/clips',
          this.manager.context.router.currentRequest.url,
        );

        if (name) url.searchParams.set('name', name);
        url.searchParams.set('extension', extension.id);

        return url;
      },
      credentials: 'include',
    });

    const extensionContext: ExtensionPointDefinitionContext = {
      ...this.manager.context,
      graphql: extensionGraphQL,
    };

    const events = new EventEmitter<{script: string}>();
    const script = signal<string | undefined>(undefined);
    const translations = signal<string | undefined>(undefined);
    const settings = signal({});
    const liveQuery = createLiveQueryRunner(
      undefined,
      (helpers) => extensionPoint.query(options as never, helpers),
      {
        context: extensionContext,
        signal: new AbortController().signal,
      },
    );
    const mutate = createMutateRunner(
      (helpers) => extensionPoint.mutate?.(options as never, helpers) ?? {},
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
          target: target as any,
          version: 'unstable',
          settings: ThreadSignal.serialize(settings, {signal}),
          localize: {locale: 'en', translations: translations.value},
          query: ThreadSignal.serialize(liveQuery.result, {signal}),
          mutate: mutate as any,
        };

        await sandbox.imports.render(target, receiver.connection, api as any);
      },
    });

    this.#pollForUpdates(
      renderer,
      events,
      script,
      translations,
      liveQuery,
      loadingUi,
    );

    return renderer;
  }

  async #pollForUpdates(
    renderer: ThreadRenderer<ClipsExtensionPointInstanceContext<any>>,
    events: EventEmitter<{script: string}>,
    script: Signal<string | undefined>,
    translations: Signal<string | undefined>,
    liveQuery: ReturnType<typeof createLiveQueryRunner>,
    loadingUi: Signal<string | undefined>,
  ) {
    let lastSuccessfulBuild:
      | LocalClipQueryData.App.ClipsExtension.Build_ExtensionBuildSuccess
      | undefined;

    for await (const result of this.manager.localDevelopment.query(
      localClipQuery,
      {
        signal: renderer.signal,
        variables: {id: this.extension.id},
      },
    )) {
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
        return extend.target === this.target;
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
}

class ClipsExtensionPointInstalledInstance<Point extends ExtensionPoint> {
  #renderer:
    | ThreadRenderer<ClipsExtensionPointInstanceContext<Point>>
    | undefined;
  #extensionPoint: ClipsExtensionPointWithOptions<Point>;

  get renderer() {
    if (this.#renderer != null) return this.#renderer;

    const {target, extension, manager, options} = this.#extensionPoint;
    const extensionPoint = manager.definitions[target];

    const extensionGraphQL = createGraphQLFetch({
      url: ({name}) => {
        const url = new URL(
          '/api/graphql/clips',
          manager.context.router.currentRequest.url,
        );

        if (name) url.searchParams.set('name', name);
        url.searchParams.set('extension', extension.id);

        return url;
      },
      credentials: 'include',
    });

    const extensionContext: ExtensionPointDefinitionContext = {
      ...manager.context,
      graphql: extensionGraphQL,
    };

    const events = new EventEmitter<{script: string}>();
    const script = signal<string | undefined>(undefined);
    const translations = signal<string | undefined>(undefined);
    const settings = signal({});
    const liveQuery = createLiveQueryRunner(
      undefined,
      (helpers) => extensionPoint.query(options as never, helpers),
      {
        context: extensionContext,
        signal: new AbortController().signal,
      },
    );
    const mutate = createMutateRunner(
      (helpers) => extensionPoint.mutate?.(options as never, helpers) ?? {},
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
          target: target as any,
          version: 'unstable',
          settings: ThreadSignal.serialize(settings, {signal}),
          localize: {locale: 'en', translations: translations.value},
          query: ThreadSignal.serialize(liveQuery.result, {signal}),
          mutate: mutate as any,
        };

        await sandbox.imports.render(target, receiver.connection, api as any);
      },
    });

    this.#renderer = renderer;
    return renderer;
  }

  constructor(
    extensionPoint: ClipsExtensionPointWithOptions<Point>,
    _installed: ClipsExtensionPointFragmentData,
  ) {
    this.#extensionPoint = extensionPoint;
  }
}

class ClipsExtensionPoint<Point extends ExtensionPoint> {
  readonly target: Point;
  readonly id: ClipsExtensionPointType<Point>['id'];
  readonly manager: ClipsManagerType;

  #localData: Signal<ClipsLocalDevelopmentServerExtension | undefined>;
  #installedData: Signal<ClipsExtensionPointFragmentData | undefined>;
  #optionsCache = new Map<
    [string, unknown][],
    ClipsExtensionPointWithOptions<any>
  >();

  constructor(
    target: Point,
    {
      manager,
      from,
    }: {
      manager: ClipsManagerType;
      from:
        | ClipsExtensionPointFragmentData
        | ClipsLocalDevelopmentServerExtension;
    },
  ) {
    this.target = target;
    this.manager = manager;
    this.id = from.id;

    if ('__typename' in from) {
      this.#installedData = signal(from);
      this.#localData = signal(undefined);
    } else {
      this.#installedData = signal(undefined);
      this.#localData = signal(from);
    }
  }

  fromOptions(
    options: OptionsForExtensionPoint<Point>,
  ): ClipsExtensionPointWithOptions<Point> {
    const optionsEntries = Object.entries(options as any);

    let extensionPoint: ClipsExtensionPointWithOptions<Point> | undefined;
    for (const [cacheOptionsEntries, cachedExtensionPoint] of this
      .#optionsCache) {
      if (defaultIsEqual(cacheOptionsEntries, optionsEntries)) {
        extensionPoint = cachedExtensionPoint;
        break;
      }
    }

    if (extensionPoint) return extensionPoint;

    extensionPoint = new ClipsExtensionPointWithOptions(this.target, options, {
      manager: this.manager,
      installed: this.#installedData,
      local: this.#localData,
    });

    this.#optionsCache.set(optionsEntries, extensionPoint);
    return extensionPoint;
  }

  updateInstalled(data: ClipsExtensionPointFragmentData) {
    if (this.#installedData.peek() != null) return;
    this.#installedData.value = data;
  }

  updateLocal(data: ClipsLocalDevelopmentServerExtension) {
    this.#localData.value = data;
  }
}

export class ClipsManager implements ClipsManagerType {
  readonly context: ExtensionPointDefinitionContext;
  readonly definitions: ExtensionPointDefinitions;
  readonly localDevelopment: ClipsLocalDevelopmentServer;

  readonly #localCache = new Map<
    string,
    ClipsLocalDevelopmentServerExtension
  >();
  readonly #installedCache = new Map<string, ClipsExtensionPointFragmentData>();
  readonly #extensionPointCache = new Map<string, ClipsExtensionPoint<any>>();
  readonly #extensionPoints = signal<ClipsExtensionPoint<any>[]>([]);

  constructor(
    context: ExtensionPointDefinitionContext,
    definitions: ExtensionPointDefinitions,
  ) {
    this.context = context;
    this.definitions = definitions;
    this.localDevelopment = new ClipsLocalDevelopmentServer();

    this.localDevelopment.extensions.subscribe((extensions) => {
      let newClips:
        | {
            id: string;
            target: ExtensionPoint;
            extension: ClipsLocalDevelopmentServerExtension;
          }[]
        | undefined;

      for (const extension of extensions) {
        for (const extensionPoint of extension.extends) {
          const id = `${extension.id}/${extensionPoint.target}`;
          if (this.#localCache.has(id)) continue;
          this.#localCache.set(id, extension);
          newClips ??= [];
          newClips.push({id, target: extensionPoint.target as any, extension});
        }
      }

      if (newClips == null) return;

      let newExtensionPoints: ClipsExtensionPoint<any>[] | undefined;

      for (const clip of newClips) {
        const cached = this.#extensionPointCache.get(clip.extension.id);

        if (cached) {
          cached.updateLocal(clip.extension);
          continue;
        }

        const extensionPoint = new ClipsExtensionPoint(clip.target as any, {
          manager: this,
          from: clip.extension,
        });

        this.#extensionPointCache.set(clip.id, extensionPoint);
        newExtensionPoints ??= [];
        newExtensionPoints.push(extensionPoint);
      }

      if (newExtensionPoints == null) return;
      this.#extensionPoints.value.push(...newExtensionPoints);
    });
  }

  addInstalledClips(clips: readonly ClipsExtensionPointFragmentData[]) {
    let newClips: ClipsExtensionPointFragmentData[] | undefined;

    for (const clip of clips) {
      if (this.#installedCache.has(clip.id)) continue;
      this.#installedCache.set(clip.id, clip);
      newClips ??= [];
      newClips.push(clip);
    }

    if (newClips == null) return;

    let newExtensionPoints: ClipsExtensionPoint<any>[] | undefined;

    for (const clip of newClips) {
      const cached = this.#extensionPointCache.get(clip.id);

      if (cached) {
        cached.updateInstalled(clip);
        continue;
      }

      const extensionPoint = new ClipsExtensionPoint(clip.target as any, {
        manager: this,
        from: clip,
      });

      this.#extensionPointCache.set(clip.id, extensionPoint);
      newExtensionPoints ??= [];
      newExtensionPoints.push(extensionPoint);
    }

    if (newExtensionPoints == null) return;
    this.#extensionPoints.value.push(...newExtensionPoints);
  }

  clipsForExtensionPoint<Point extends ExtensionPoint>(
    point: Point,
    options: OptionsForExtensionPoint<Point>,
  ): readonly ClipsExtensionPointWithOptions<Point>[] {
    return this.#extensionPoints.value
      .filter((instance) => instance.target === point)
      .map((instance) => instance.fromOptions(options));
  }
}

interface ClipsLocalDevelopmentServerThreadApi {
  query<Data, Variables>(
    query: string,
    options?: {variables?: Variables; signal?: ThreadAbortSignalSerialization},
  ): AsyncGenerator<{data?: Data}, void, void>;
}

class ClipsLocalDevelopmentServer {
  #threadPromise: ReturnType<
    typeof createResolvablePromise<{
      thread: Thread<ClipsLocalDevelopmentServerThreadApi>;
    }>
  >;
  url: Signal<URL | undefined>;
  connected: Signal<boolean>;
  extensions: Signal<ClipsLocalDevelopmentServerExtension[]>;
  #events: EventEmitter<ClipsLocalDevelopmentServerEventMap>;

  constructor() {
    this.#threadPromise = createResolvablePromise<{
      thread: Thread<ClipsLocalDevelopmentServerThreadApi>;
    }>();
    this.url = signal(undefined);
    this.#events = new EventEmitter<ClipsLocalDevelopmentServerEventMap>();
    this.connected = signal(false);
    this.extensions = signal([]);
  }

  async *query<Data, Variables>(
    graphql: GraphQLOperation<Data, Variables>,
    options?: GraphQLVariableOptions<Variables> & {signal?: AbortSignal},
  ): AsyncGenerator<GraphQLResult<Data>, void, void> {
    const {thread} = await this.#threadPromise.promise;

    for await (const result of this.#queryWithThread(
      thread,
      graphql,
      options as any,
    )) {
      yield result;
    }
  }

  async connect(newUrl: URL) {
    this.connected.value = false;
    this.url.value = new URL(newUrl);

    this.#events.emit('connect:start');

    try {
      const socket = new WebSocket(newUrl.href);
      const thread =
        new ThreadBrowserWebSocket<ClipsLocalDevelopmentServerThreadApi>(
          socket,
        );

      this.#threadPromise.resolve({thread});
      this.connected.value = true;

      this.#events.emit('connect:end');

      this.#queryLocalExtensions();
    } catch (error) {
      this.#threadPromise.reject(error);
      this.#events.emit('connect:error');
      this.#events.emit('connect:end');

      throw error;
    }
  }

  on: EventEmitter<ClipsLocalDevelopmentServerEventMap>['on'] = (...args) =>
    (this.#events as any).on(...args);
  once: EventEmitter<ClipsLocalDevelopmentServerEventMap>['once'] = (...args) =>
    (this.#events as any).once(...args);

  async *#queryWithThread(
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

  async #queryLocalExtensions() {
    for await (const {data} of this.query(localClipsExtensionsQuery)) {
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

      this.extensions.value = newExtensions;
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
