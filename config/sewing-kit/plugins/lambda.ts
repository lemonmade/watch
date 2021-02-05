import {
  Task,
  Service,
  createProjectPlugin,
  createComposedProjectPlugin,
} from '@sewing-kit/plugins';
import {virtualModules} from 'sewing-kit-plugin-webpack-virtual-modules';

const PLUGIN = 'LambdaBuild';

export function lambdaBuild() {
  return createComposedProjectPlugin<Service>(PLUGIN, [
    virtualModules(
      ({project, api}) => {
        const entry = project.fs.resolvePath(project.entry ?? 'index');

        return {
          [api.tmpPath(`lambda-wrapper/${project.name}.js`)]: `
            import * as handlerModule from ${JSON.stringify(entry)};
      
            const handler = getHandler();
      
            export {handler};
      
            function getHandler() {
              if (typeof handlerModule.default === 'function') return handlerModule.default;
              if (typeof handlerModule.handler === 'function') return handlerModule.handler;
              if (typeof handlerModule.main === 'function') return handlerModule.main;
      
              throw new Error('No handler found in module ' + ${JSON.stringify(
                entry,
              )});
            }
          `,
        };
      },
      {asEntry: true, include: [Task.Build]},
    ),
    createProjectPlugin(`${PLUGIN}.WebpackConfig`, ({tasks: {build}}) => {
      build.hook(({hooks}) => {
        hooks.target.hook(({hooks}) => {
          hooks.configure.hook((configure) => {
            configure.webpackOutputFilename?.hook(() => 'index.js');
            configure.webpackConfig?.hook((config) => ({
              ...config,
              output: {
                ...config.output,
                libraryTarget: 'commonjs2',
              },
            }));
          });
        });
      });
    }),
  ]);
}
