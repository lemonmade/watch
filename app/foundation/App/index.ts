import {createWorkerComponent} from '@quilted/quilt';

export const App = createWorkerComponent(() => import('./App'));
