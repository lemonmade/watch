import {
  createWorker,
  createThread,
  targetFromWebWorker,
} from '@quilted/quilt/threads';

import type {Sandbox} from './sandbox';

export type {Sandbox};

const createSandboxWorker = createWorker(() => import('./sandbox'));

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
