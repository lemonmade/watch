import {createService, quiltService} from '@quilted/craft';
import {lambda} from '@quilted/aws/sewing-kit';

import {prisma, dotenv} from '../../config/sewing-kit/plugins';

export default createService((service) => {
  service.entry('./auth');
  service.use(
    quiltService({
      develop: {port: 8911},
      polyfill: {features: ['fetch']},
    }),
    lambda(),
    prisma(),
    dotenv(),
  );
});
