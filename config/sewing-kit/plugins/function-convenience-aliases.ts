import {Service, createProjectPlugin} from '@sewing-kit/plugins';

const PLUGIN = 'Watch.FunctionConvenienceAliases';

export function functionConvenienceAliases() {
  return createProjectPlugin<Service>(PLUGIN, ({workspace, tasks: {build}}) => {
    build.hook(({hooks}) => {
      hooks.target.hook(({hooks}) => {
        hooks.configure.hook((configure) => {
          configure.webpackAliases?.hook((aliases) => ({
            ...aliases,
            global: workspace.fs.resolvePath('global'),
            shared: workspace.fs.resolvePath('functions/shared'),
          }));
        });
      });
    });
  });
}
