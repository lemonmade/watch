import type {ClipsGlobal} from '@watching/clips';

import {createHotWorker} from '@watching/webpack-hot-worker/worker';

const hotWorker = createHotWorker();

hotWorker.on('reload', () => {
  ((self as any) as ClipsGlobal).clips.restart();
});

hotWorker.start();
