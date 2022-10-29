import {useMemo, useEffect} from 'react';
import {type Version} from '@watching/clips';
import {createEmitter, type Emitter} from '@quilted/quilt';
import {signal, type Signal} from '@watching/thread-signals';

import {createSandbox, type Sandbox} from './sandboxes';

export interface Options {
  script: string;
  version: Version;
}

export interface SandboxControllerTiming {
  readonly start?: number;
  readonly loadStart?: number;
  readonly loadEnd?: number;
}

export type ExtensionSandbox = Omit<Sandbox, 'load'>;

export interface SandboxController {
  readonly id: string;
  readonly state: 'stopped' | 'loading' | 'loaded';
  readonly timings: Signal<SandboxControllerTiming>;
  start(): Promise<void>;
  stop(): void;
  restart(): Promise<void>;
  run<T>(runner: (sandbox: ExtensionSandbox) => T | Promise<T>): Promise<T>;
  on: Emitter<{start: void; stop: void; load: void}>['on'];
}

type Writable<T> = {-readonly [K in keyof T]: T[K]};

export function useExtensionSandbox({script, version}: Options) {
  const sandbox = useMemo(() => {
    let startId = 0;
    let loadPromise: Promise<void> | undefined;
    let sandbox: ReturnType<typeof createSandbox> | undefined;
    let abort: AbortController;
    const timings: Signal<Writable<SandboxControllerTiming>> = signal({});
    const emitter = createEmitter<{start: void; stop: void; load: void}>();

    start();

    const sandboxProxy: ExtensionSandbox = {
      render: (...args) => (call as any)('render', ...args),
      getResourceTimingEntries: (...args) =>
        call('getResourceTimingEntries', ...args),
    };

    const sandboxController: SandboxController = {
      timings,
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
      timings.value = {start: Date.now()};
      sandbox = createSandbox({
        signal: abort.signal,
      });

      timings.value.loadStart = Date.now();
      loadPromise = sandbox.load(script, version as Version);
      emitter.emit('start');

      await loadPromise;

      if (currentStartId === startId) {
        loadPromise = undefined;
        emitter.emit('load');

        if (timings) {
          timings.value.loadEnd = Date.now();
        }
      }
    }

    function stop() {
      abort.abort();
      sandbox = undefined;
      loadPromise = undefined;
      timings.value = {};
      startId += 1;
      emitter.emit('stop');
    }

    function restart() {
      stop();
      return start();
    }
  }, [script, version]);

  useEffect(() => {
    return () => {
      sandbox.stop();
    };
  }, [sandbox]);

  return sandbox;
}
