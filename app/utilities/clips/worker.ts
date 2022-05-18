import {useMemo, useEffect} from 'react';
import type {Version} from '@watching/clips';
import {createEmitter} from '@quilted/quilt';
import type {Emitter} from '@quilted/quilt';

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
  on: Emitter<{start: void; stop: void; load: void}>['on'];
}

export type ExtensionSandbox = Omit<Sandbox, 'load'>;

type Writable<T> = {-readonly [K in keyof T]: T[K]};

export function useExtensionSandbox({script, version}: Options) {
  const [sandbox, controller] = useMemo(() => {
    let startId = 0;
    let loadPromise: Promise<void> | undefined;
    let sandbox: ReturnType<typeof createSandbox> | undefined;
    let timings: Writable<SandboxControllerTiming> | undefined;
    const abort = new AbortController();
    const emitter = createEmitter<{start: void; stop: void; load: void}>();

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
      on: emitter.on,
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
      sandbox = createSandbox({
        signal: abort.signal,
      });

      timings!.loadStart = Date.now();
      loadPromise = sandbox.load(script, version as Version);
      emitter.emit('start');

      await loadPromise;

      if (currentStartId === startId) {
        loadPromise = undefined;
        emitter.emit('load');

        if (timings) {
          timings.loadEnd = Date.now();
        }
      }
    }

    function stop() {
      abort.abort();
      sandbox = undefined;
      loadPromise = undefined;
      timings = undefined;
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
      controller.stop();
    };
  }, [controller]);

  return [sandbox, controller] as const;
}
