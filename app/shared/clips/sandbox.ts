import {
  createWorker,
  createThread,
  targetFromWebWorker,
} from '@quilted/quilt/threads';

import type {Sandbox} from './sandbox/sandbox.ts';

export type {Sandbox};

const createSandboxWorker = createWorker(() => import('./sandbox/sandbox.ts'));

export function createSandbox({signal}: {signal: AbortSignal}) {
  const worker = createSandboxWorker();

  signal.addEventListener(
    'abort',
    () => {
      worker.terminate();
    },
    {once: true},
  );

  return createThread<never, Sandbox>(targetFromWebWorker(worker), {
    signal,
  });
}
