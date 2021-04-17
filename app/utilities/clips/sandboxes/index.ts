import {createWorkerFactory} from '@quilted/quilt';

export const createSandbox = createWorkerFactory(
  () => import(/* webpackChunkName: 'ClipsSandbox' */ './sandbox'),
);

export type Sandbox = ReturnType<typeof createSandbox>;
