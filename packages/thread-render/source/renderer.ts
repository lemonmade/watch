import {retain, release} from '@quilted/threads';
import {EventEmitter, raceAgainstAbortSignal} from '@quilted/events';
import {SignalRemoteReceiver} from '@lemonmade/remote-ui/signals';
import {signal, computed} from '@preact/signals-core';

import {
  type ThreadRenderer,
  type ThreadRendererEventMap,
  type ThreadRendererInstance,
  type ThreadRendererInstanceEventMap,
  type ThreadRendererInstanceTimings,
  type ThreadRendererInstanceState,
} from './types.ts';

export type PartialThreadRendererInstance = Omit<
  ThreadRendererInstance<never>,
  'context'
>;

export interface ThreadRendererOptions<Context = Record<string, never>> {
  context?(
    instance: PartialThreadRendererInstance,
    renderer: ThreadRenderer<Context>,
  ): Context;
  prepare?(
    instance: ThreadRendererInstance<Context>,
    renderer: ThreadRenderer<Context>,
  ): void | Promise<void>;
  render(
    instance: ThreadRendererInstance<Context>,
    renderer: ThreadRenderer<Context>,
  ): void | Promise<void>;
}

type RendererInternals<Context = Record<string, never>> = {
  abort: AbortController;
} & Omit<ThreadRendererInstance<Context>, 'signal'>;

export function createRenderer<Context = Record<string, never>>({
  context: createContext,
  prepare,
  render,
}: ThreadRendererOptions<Context>) {
  const abort = new AbortController();

  const instanceInternals = signal<RendererInternals<Context> | undefined>(
    undefined,
  );

  const instance = computed(() => {
    const internals = instanceInternals.value;
    if (internals == null) return undefined;

    const {abort, ...rest} = internals;

    return {signal: internals.abort.signal, ...rest};
  });

  const events = new EventEmitter<ThreadRendererEventMap>();
  const renderer: ThreadRenderer<Context> = {
    signal: abort.signal,
    on: events.on,
    once: events.once,
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
    const receiver = new SignalRemoteReceiver({retain, release});
    const state = signal<ThreadRendererInstanceState>('preparing');
    const timings = signal<ThreadRendererInstanceTimings>({});

    const instanceEvents = new EventEmitter<ThreadRendererInstanceEventMap>();

    const partialInstance: PartialThreadRendererInstance = {
      signal: abort.signal,
      timings,
      receiver,
      state,
      on: instanceEvents.on,
      once: instanceEvents.once,
    };

    const context =
      createContext?.(partialInstance, renderer) ?? ({} as Context);

    const internals: RendererInternals<Context> = {
      abort,
      timings,
      context,
      receiver,
      state,
      on: instanceEvents.on,
      once: instanceEvents.once,
    };

    instanceInternals.value = internals;

    events.emit('start');

    const currentInstance = instance.value!;

    if (prepare) {
      state.value = 'preparing';
      timings.value = {...timings.value, prepareStart: Date.now()};

      instanceEvents.emit('prepare:start');

      await raceAgainstAbortSignal(
        () => Promise.resolve(prepare(currentInstance, renderer)),
        {
          signal: currentInstance.signal,
          onAbort() {
            instanceEvents.emit('prepare:abort');
          },
        },
      );

      timings.value = {...timings.value, prepareEnd: Date.now()};
    }

    state.value = 'rendering';
    timings.value = {...timings.value, renderStart: Date.now()};

    instanceEvents.emit('render:start');

    await raceAgainstAbortSignal(
      () => Promise.resolve(render(currentInstance, renderer)),
      {
        signal: currentInstance.signal,
        onAbort() {
          instanceEvents.emit('render:abort');
        },
      },
    );

    state.value = 'rendered';
    timings.value = {...timings.value, renderEnd: Date.now()};

    instanceEvents.emit('render:end');
  }

  async function stop() {
    const instance = instanceInternals.value;

    if (instance) {
      instance.abort.abort();
      (instance.state as any).value = 'stopped';

      instanceInternals.value = undefined;
    }

    events.emit('stop');
  }

  async function destroy() {
    await stop();
    abort.abort();
    events.emit('destroy');
  }

  async function restart() {
    await stop();
    await start();
    events.emit('restart');
  }
}
