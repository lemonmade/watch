import {createThreadWorker} from '@quilted/quilt/threads';

export const createSandbox = createThreadWorker(() => import('./sandbox'));
export type Sandbox = ReturnType<typeof createSandbox>;
