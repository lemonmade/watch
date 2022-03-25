import {createProjectPlugin} from '@quilted/craft';
import type {} from '@quilted/craft/rollup';

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
