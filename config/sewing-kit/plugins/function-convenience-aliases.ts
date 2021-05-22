import {Service, createProjectPlugin} from '@sewing-kit/plugins';

const PLUGIN = 'Watch.FunctionConvenienceAliases';

export function functionConvenienceAliases() {
  return createProjectPlugin<Service>(PLUGIN, ({workspace, tasks: {build}}) => {
    build.hook(({hooks}) => {
      hooks.target.hook(({hooks}) => {
        hooks.configure.hook((configure) => {
          configure.rollupPlugins?.hook(async (plugins) => {
            const {default: alias} = await import('@rollup/plugin-alias');

            return [
              alias({
                entries: {
                  global: workspace.fs.resolvePath('global'),
                  shared: workspace.fs.resolvePath('functions/shared'),
                },
              }),
              ...plugins,
            ];
          });
        });
      });
    });
  });
}
