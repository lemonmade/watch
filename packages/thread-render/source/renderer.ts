import {createEmitter, AbortError} from '@quilted/events';
import {signal, computed} from '@preact/signals-core';
import {createRemoteReceiver} from './receiver';

import {
  type ThreadRenderer,
  type ThreadRendererEventMap,
  type ThreadRendererInstance,
  type ThreadRendererInstanceEventMap,
  type ThreadRendererInstanceTimings,
  type ThreadRendererInstanceState,
} from './types';

export type PartialThreadRendererInstance<
  Api = Record<string, never>,
  Components = Record<string, never>,
  Thread = Record<string, never>,
> = Omit<
  ThreadRendererInstance<Api, Components, Thread>,
  'api' | 'components' | 'thread'
>;

export interface ThreadRendererOptions<
  Api = Record<string, never>,
  Components = Record<string, never>,
  Thread = Record<string, never>,
  Options = Record<string, never>,
  Context = Record<string, never>,
> {
  options: Options;
  context: Context;
  createApi(
    instance: PartialThreadRendererInstance<Api, Components, Thread>,
    renderer: ThreadRenderer<Api, Components, Thread, Options, Context>,
  ): Api;
  createComponents(
    instance: PartialThreadRendererInstance<Api, Components, Thread>,
    renderer: ThreadRenderer<Api, Components, Thread, Options, Context>,
  ): Components;
  createThread(
    instance: PartialThreadRendererInstance<Api, Components, Thread>,
    renderer: ThreadRenderer<Api, Components, Thread, Options, Context>,
  ): Thread;
  prepare(
    instance: ThreadRendererInstance<Api, Components, Thread>,
    renderer: ThreadRenderer<Api, Components, Thread, Options, Context>,
  ): void | Promise<void>;
  render(
    instance: ThreadRendererInstance<Api, Components, Thread>,
    renderer: ThreadRenderer<Api, Components, Thread, Options, Context>,
  ): void | Promise<void>;
}

type RendererInternals<Api, Components, Thread> = {
  abort: AbortController;
} & Omit<ThreadRendererInstance<Api, Components, Thread>, 'signal'>;

export function createRenderer<
  Api = Record<string, never>,
  Components = Record<string, never>,
  Thread = Record<string, never>,
  Options = Record<string, never>,
  Context = Record<string, never>,
>({
  options,
  context,
  createApi,
  createComponents,
  createThread,
  prepare,
  render,
}: ThreadRendererOptions<Api, Components, Thread, Options, Context>) {
  const abort = new AbortController();

  const instanceInternals = signal<
    RendererInternals<Api, Components, Thread> | undefined
  >(undefined);

  const instance = computed(() => {
    const internals = instanceInternals.value;
    if (internals == null) return undefined;

    const {abort, ...rest} = internals;

    return {signal: internals.abort.signal, ...rest};
  });

  const emitter = createEmitter<ThreadRendererEventMap>();
  const renderer: ThreadRenderer<Api, Components, Thread, Options, Context> = {
    options,
    context,
    signal: abort.signal,
    on: emitter.on,
    instance,
    start,
    stop,
    destroy,
    restart,
  };

  return renderer;

  async function start() {
    if (instanceInternals.value != null) return;

    const abort = new AbortController();
    const receiver = createRemoteReceiver();
    const state = signal<ThreadRendererInstanceState>('preparing');
    const timings = signal<ThreadRendererInstanceTimings>({
      prepareStart: Date.now(),
    });

    const instanceEmitter = createEmitter<ThreadRendererInstanceEventMap>();

    const partialInstance: PartialThreadRendererInstance<
      Api,
      Components,
      Thread
    > = {
      signal: abort.signal,
      timings,
      receiver,
      state,
      on: instanceEmitter.on,
    };

    const api = createApi(partialInstance, renderer);
    const components = createComponents(partialInstance, renderer);
    const thread = createThread(partialInstance, renderer);

    const internals: RendererInternals<Api, Components, Thread> = {
      abort,
      timings,
      api,
      components,
      receiver,
      thread,
      state,
      on: instanceEmitter.on,
    };

    instanceInternals.value = internals;

    emitter.emit('start');

    const currentInstance = instance.value!;

    instanceEmitter.emit('prepare:start');

    await raceAgainstInstance(
      Promise.resolve(prepare(currentInstance, renderer)),
      currentInstance,
      () => instanceEmitter.emit('prepare:abort'),
    );

    timings.value = {...timings.value, prepareEnd: Date.now()};

    instanceEmitter.emit('prepare:end');

    timings.value = {...timings.value, renderStart: Date.now()};

    instanceEmitter.emit('render:start');

    await raceAgainstInstance(
      Promise.resolve(render(currentInstance, renderer)),
      currentInstance,
      () => instanceEmitter.emit('render:abort'),
    );

    instanceEmitter.emit('render:end');

    timings.value = {...timings.value, renderEnd: Date.now()};
  }

  async function stop() {
    instanceInternals.value?.abort.abort();
    instanceInternals.value = undefined;
    emitter.emit('stop');
  }

  async function destroy() {
    await stop();
    abort.abort();
    emitter.emit('destroy');
  }

  async function restart() {
    await stop();
    await start();
    emitter.emit('restart');
  }

  async function raceAgainstInstance<T>(
    race: Promise<T>,
    {signal}: Pick<PartialThreadRendererInstance, 'signal'>,
    ifAborted: () => void,
  ) {
    const raceAbort = new AbortController();

    const result = await Promise.race([racer(), abortRacer()]);

    return result as T;

    async function racer() {
      try {
        const result = await race;
        return result;
      } finally {
        raceAbort.abort();
      }
    }

    async function abortRacer() {
      await new Promise<void>((resolve, reject) => {
        signal.addEventListener(
          'abort',
          () => {
            ifAborted();
            reject(new AbortError());
          },
          {signal: raceAbort.signal},
        );

        raceAbort.signal.addEventListener(
          'abort',
          () => {
            resolve();
          },
          {signal},
        );
      });
    }
  }
}
