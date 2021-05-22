import {createService} from '@sewing-kit/config';
import {quiltService} from '@quilted/sewing-kit-plugins';
import {lambda} from '@quilted/aws/sewing-kit';

import {
  prisma,
  functionConvenienceAliases,
} from '../../config/sewing-kit/plugins';

export default createService((service) => {
  service.entry('./index');
  service.use(
    quiltService({
      develop: {port: 8910},
      polyfill: {features: ['base', 'fetch']},
    }),
    lambda(),
    prisma(),
    functionConvenienceAliases(),
  );
});
