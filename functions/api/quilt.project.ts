import {createProjectPlugin, createService, quiltService} from '@quilted/craft';
import {lambda} from '@quilted/aws/craft';

import {prisma} from '../../config/craft/plugins';

export default createService((service) => {
  service.entry('./api');
  service.use(
    quiltService({
      develop: {port: 8910},
      polyfill: {features: ['fetch', 'abort-controller']},
      env: {
        inline: [
          'EMAIL_QUEUE_URL',
          'DATABASE_URL',
          'JWT_DEFAULT_SECRET',
          'TMDB_ACCESS_TOKEN',
        ],
      },
    }),
    lambda(),
    prisma(),
    createProjectPlugin({
      name: 'Watch.Api.Fixes',
      build({configure}) {
        configure(({rollupNodeExportConditions}) => {
          rollupNodeExportConditions?.((conditions) => {
            let indexOfESNext = 0;

            for (const condition of conditions) {
              if (!/esnext/.test(condition)) break;
              indexOfESNext += 1;
            }

            return [
              ...conditions.slice(0, indexOfESNext),
              'node',
              ...conditions.slice(indexOfESNext),
            ];
          });
        });
      },
    }),
  );
});
