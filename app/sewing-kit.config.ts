import {createApp, quiltApp, createProjectPlugin} from '@quilted/craft';
import type {App} from '@quilted/craft';
import {lambda} from '@quilted/aws/sewing-kit';

import type {} from '@quilted/sewing-kit-jest';
import type {} from '@quilted/sewing-kit-vite';

export default createApp((app) => {
  app.entry('./App');
  app.use(
    quiltApp({
      autoServer: true,
      assets: {baseUrl: '/assets/app/'},
    }),
    lambda(),
    createProjectPlugin<App>({
      name: 'Watch.RandomBits',
      build({configure, project}) {
        configure(({rollupPlugins}) => {
          rollupPlugins?.(async (plugins) => {
            const [{default: alias}, tsconfig] = await Promise.all([
              import('@rollup/plugin-alias'),
              (async () => {
                try {
                  const tsconfig = await project.fs.read('tsconfig.json');
                  return JSON.parse(tsconfig) as {
                    compilerOptions?: {paths?: Record<string, string[]>};
                  };
                } catch {
                  // intentional noop
                }
              })(),
            ]);

            const tsconfigPaths = tsconfig?.compilerOptions?.paths;

            if (tsconfigPaths == null) return plugins;

            plugins.unshift(
              alias({
                entries: Object.entries(tsconfigPaths).map(
                  ([name, aliases]) => {
                    return {
                      find: name.includes('*')
                        ? new RegExp(`^${name.replace(/\*/, '(.*)')}$`)
                        : name,
                      replacement: project.fs
                        .resolvePath(aliases[0])
                        .replace('*', '$1'),
                    };
                  },
                ),
              }),
            );

            return plugins;
          });
        });
      },
      develop({configure, project}) {
        configure(({vitePlugins}) => {
          vitePlugins?.(async (plugins) => {
            const [{default: alias}, tsconfig] = await Promise.all([
              import('@rollup/plugin-alias'),
              (async () => {
                try {
                  const tsconfig = await project.fs.read('tsconfig.json');
                  return JSON.parse(tsconfig) as {
                    compilerOptions?: {paths?: Record<string, string[]>};
                  };
                } catch {
                  // intentional noop
                }
              })(),
            ]);

            const tsconfigPaths = tsconfig?.compilerOptions?.paths;

            if (tsconfigPaths == null) return plugins;

            plugins.unshift(
              alias({
                entries: Object.entries(tsconfigPaths).map(
                  ([name, aliases]) => {
                    return {
                      find: name.includes('*')
                        ? new RegExp(`^${name.replace(/\*/, '(.*)')}$`)
                        : name,
                      replacement: project.fs
                        .resolvePath(aliases[0])
                        .replace('*', '$1'),
                    };
                  },
                ),
              }),
            );

            return plugins;
          });
        });
      },
      test({workspace, configure}) {
        configure(({jestConfig}) => {
          jestConfig?.((config) => {
            config.resolver = workspace.fs.resolvePath(
              'config/jest/resolver.cjs',
            );

            return config;
          });
        });
      },
    }),
    // globalConvenienceAliases(),
  );
});

// function globalConvenienceAliases() {
//   return createProjectPlugin(
//     'Watch.GlobalConvenienceAliases',
//     ({workspace, tasks: {build, dev}}) => {
//       build.hook(({hooks}) => {
//         hooks.target.hook(({hooks}) => {
//           hooks.configure.hook((configure) => {
//             configure.rollupPlugins?.hook(async (plugins) => {
//               const {default: alias} = await import('@rollup/plugin-alias');

//               return [
//                 alias({
//                   entries: {
//                     global: workspace.fs.resolvePath('global'),
//                   },
//                 }),
//                 ...plugins,
//               ];
//             });
//           });
//         });
//       });

//       dev.hook(({hooks}) => {
//         hooks.configure.hook((configure) => {
//           configure.rollupPlugins?.hook(async (plugins) => {
//             const {default: alias} = await import('@rollup/plugin-alias');

//             return [
//               alias({
//                 entries: {
//                   global: workspace.fs.resolvePath('global'),
//                 },
//               }),
//               ...plugins,
//             ];
//           });
//         });
//       });
//     },
//   );
// }
