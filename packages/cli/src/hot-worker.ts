import type {} from '@watching/clips';

import {createHotWorker} from '@watching/webpack-hot-worker/worker';

const hotWorker = createHotWorker();

hotWorker.on('reload', () => {
  self.clips.reload();
});

hotWorker.start();
