import {createProjectPlugin} from '@quilted/sewing-kit';
import type {} from '@quilted/sewing-kit-rollup';

export const prisma = () =>
  createProjectPlugin({
    name: 'Watch.Prisma',
    build({configure}) {
      configure(({rollupExternals}) => {
        rollupExternals?.((externals) => {
          externals.push('@prisma/client');
          return externals;
        });
      });
    },
    develop({configure}) {
      configure(({rollupExternals}) => {
        rollupExternals?.((externals) => {
          externals.push('@prisma/client');
          return externals;
        });
      });
    },
  });
