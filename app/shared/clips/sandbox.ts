import {createWorker, ThreadWebWorker} from '@quilted/quilt/threads';

import type {Sandbox} from './sandbox/sandbox.ts';

export type {Sandbox};

const SandboxWorker = createWorker(() => import('./sandbox/sandbox.ts'));

export function createSandbox({signal}: {signal: AbortSignal}) {
  const worker = new SandboxWorker();

  signal.addEventListener(
    'abort',
    () => {
      worker.terminate();
    },
    {once: true},
  );

  return new ThreadWebWorker<Sandbox>(worker, {
    signal,
  });
}
