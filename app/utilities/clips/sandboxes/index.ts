import {createCallableWorker} from '@quilted/quilt';

export const createSandbox = createCallableWorker(() => import('./sandbox'));
export type Sandbox = ReturnType<typeof createSandbox>;
