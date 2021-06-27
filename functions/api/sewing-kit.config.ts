import {createService, quiltService} from '@quilted/craft';
import {lambda} from '@quilted/aws/sewing-kit';

import {prisma, dotenv} from '../../config/sewing-kit/plugins';

export default createService((service) => {
  service.entry('./api');
  service.use(
    quiltService({
      develop: {port: 8910},
      polyfill: {features: ['fetch']},
    }),
    lambda(),
    prisma(),
    dotenv(),
  );
});
