import {createCallableWorker} from '@quilted/workers';

export const createSandbox = createCallableWorker(() => import('./sandbox'));
export type Sandbox = ReturnType<typeof createSandbox>;
