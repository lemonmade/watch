import {useMemo, useEffect} from 'react';
import type {Version} from '@watching/clips';
import {expose, terminate} from '@quilted/quilt/workers';

import {createSandbox} from './sandboxes';
import type {Sandbox} from './sandboxes';

export interface Options {
  script: string;
  version: Version;
}

export interface SandboxControllerTiming {
  readonly start?: number;
  readonly loadStart?: number;
  readonly loadEnd?: number;
}

export interface SandboxController {
  readonly id: string;
  readonly state: 'stopped' | 'loading' | 'loaded';
  readonly timings: SandboxControllerTiming;
  start(): Promise<void>;
  stop(): void;
  restart(): Promise<void>;
  on(event: 'start' | 'stop' | 'load', handler: () => void): () => void;
}

export type ExtensionSandbox = Omit<Sandbox, 'load'>;

type Writable<T> = {-readonly [K in keyof T]: T[K]};

export function useExtensionSandbox({script, version}: Options) {
  const [sandbox, controller] = useMemo(() => {
    let startId = 0;
    let loadPromise: Promise<void> | undefined;
    let sandbox: ReturnType<typeof createSandbox> | undefined;
    let timings: Writable<SandboxControllerTiming> | undefined;
    const listeners = new Map<'start' | 'stop' | 'load', Set<() => void>>();

    start();

    const sandboxProxy: ExtensionSandbox = {
      render: (...args) => call('render', ...args),
      getResourceTimingEntries: (...args) =>
        call('getResourceTimingEntries', ...args),
    };

    const sandboxController: SandboxController = {
      timings: {
        get start() {
          return timings?.start;
        },
        get loadStart() {
          return timings?.loadStart;
        },
        get loadEnd() {
          return timings?.loadEnd;
        },
      },
      get id() {
        return String(startId);
      },
      get state() {
        if (loadPromise) {
          return 'loading';
        } else if (sandbox) {
          return 'loaded';
        } else {
          return 'stopped';
        }
      },
      start,
      stop,
      restart,
      on: (event, handler) => {
        let listenersForEvent = listeners.get(event);

        if (listenersForEvent == null) {
          listenersForEvent = new Set();
          listeners.set(event, listenersForEvent);
        }

        listenersForEvent.add(handler);

        return () => {
          listenersForEvent!.delete(handler);
        };
      },
    };

    return [sandboxProxy, sandboxController] as const;

    async function call<K extends keyof Sandbox>(
      key: K,
      ...args: Parameters<Sandbox[K]>
    ) {
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

      timings = {start: Date.now()};
      sandbox = createSandbox();
      expose(sandbox, {restart});

      timings!.loadStart = Date.now();
      loadPromise = sandbox.load(script, version as Version);
      emit('start');

      await loadPromise;

      if (currentStartId === startId) {
        loadPromise = undefined;
        emit('load');

        if (timings) {
          timings.loadEnd = Date.now();
        }
      }
    }

    function stop() {
      terminate(sandbox);
      sandbox = undefined;
      loadPromise = undefined;
      timings = undefined;
      startId += 1;
      emit('stop');
    }

    function restart() {
      stop();
      return start();
    }

    function emit(event: 'start' | 'stop' | 'load') {
      const listenersForEvent = listeners.get(event);
      if (listenersForEvent == null) return;

      for (const listener of listenersForEvent) {
        listener();
      }
    }
  }, [script, version]);

  useEffect(() => {
    return () => {
      controller.stop();
    };
  }, [controller]);

  return [sandbox, controller] as const;
}
