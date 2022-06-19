import {createService, quiltService} from '@quilted/craft';

import {prisma} from '../../config/craft/plugins';

export default createService((service) => {
  service.entry('./tmdb-refresher');
  service.use(
    quiltService({
      develop: false,
      polyfill: {features: ['fetch', 'abort-controller']},
    }),
    prisma(),
  );
});
