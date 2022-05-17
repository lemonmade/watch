import {createService, quiltService} from '@quilted/craft';
import {lambda} from '@quilted/aws/craft';

import {prisma} from '../../config/craft/plugins';

export default createService((service) => {
  service.entry('./auth');
  service.use(
    quiltService({
      develop: {port: 8911},
      polyfill: {features: ['fetch', 'abort-controller']},
      env: {
        inline: [
          'DATABASE_URL',
          'JWT_DEFAULT_SECRET',
          'GITHUB_CLIENT_ID',
          'GITHUB_CLIENT_SECRET',
        ],
      },
    }),
    lambda(),
    prisma(),
  );
});
