import {createService, quiltService} from '@quilted/craft';
import {lambda} from '@quilted/aws/craft';

import {prisma} from '../../config/craft/plugins';

export default createService((service) => {
  service.entry('./tmdb-refresher');
  service.use(
    quiltService({
      develop: false,
      httpHandler: false,
      polyfill: {features: ['fetch']},
    }),
    lambda(),
    prisma(),
  );
});
