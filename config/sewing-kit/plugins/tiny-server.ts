import {
  Task,
  Service,
  createProjectPlugin,
  createComposedProjectPlugin,
} from '@sewing-kit/plugins';
import {virtualModules} from 'sewing-kit-plugin-webpack-virtual-modules';

const PLUGIN = 'TinyServer';

export function tinyServer() {
  return createComposedProjectPlugin<Service>(PLUGIN, [
    virtualModules(
      ({project, api}) => {
        const entry = project.fs.resolvePath(project.entry ?? 'index');

        return {
          [api.tmpPath(`tiny-server-wrapper/${project.name}.js`)]: `
            import {createLambdaApiGatewayProxy} from '@lemon/tiny-server-aws';
            import * as appModule from ${JSON.stringify(entry)};
      
            const handler = createLambdaApiGatewayProxy(getApp());
      
            export {handler};
      
            function getApp() {
              if (typeof appModule.default === 'object') return appModule.default;
              if (typeof appModule.app === 'object') return appModule.app;
      
              throw new Error('No app found in module ' + ${JSON.stringify(
                entry,
              )});
            }
          `,
        };
      },
      {asEntry: true, include: [Task.Build]},
    ),
    createProjectPlugin(
      `${PLUGIN}.WebpackConfig`,
      ({workspace, tasks: {build}}) => {
        build.hook(({hooks}) => {
          hooks.target.hook(({hooks}) => {
            hooks.configure.hook((configure) => {
              configure.webpackExternals?.hook((externals) => [
                ...externals,
                'aws-sdk',
              ]);
              configure.webpackAliases?.hook((aliases) => ({
                ...aliases,
                shared: workspace.fs.resolvePath('functions/shared'),
              }));
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
      },
    ),
  ]);
}
