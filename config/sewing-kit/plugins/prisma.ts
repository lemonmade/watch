import {createProjectPlugin} from '@sewing-kit/plugins';

export const prisma = () =>
  createProjectPlugin('Watch.Prisma', ({tasks: {build, dev}}) => {
    build.hook(({hooks}) => {
      hooks.target.hook(({hooks}) => {
        hooks.configure.hook(({rollupExternal}) => {
          rollupExternal?.hook((external) =>
            Array.isArray(external)
              ? [...external, '@prisma/client']
              : [external as any, '@prisma/client'],
          );
        });
      });
    });

    dev.hook(({hooks}) => {
      hooks.configure.hook(({rollupExternal}) => {
        rollupExternal?.hook((external) =>
          Array.isArray(external)
            ? [...external, '@prisma/client']
            : [external as any, '@prisma/client'],
        );
      });
    });
  });
