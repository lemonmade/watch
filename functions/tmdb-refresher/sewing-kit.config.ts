import {createService, quiltService} from '@quilted/craft';
import {lambda} from '@quilted/aws/sewing-kit';

import {prisma} from '../../config/sewing-kit/plugins';

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
