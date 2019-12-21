import {createService} from '@sewing-kit/config';
import {Project} from '@sewing-kit/model';
import {createQuiltServicePlugin} from '@quilted/sewing-kit-plugins';
import {createProjectPlugin} from '@sewing-kit/plugins';
import {} from '@sewing-kit/plugin-webpack';

import {createKnexPlugin, Dialect} from 'sewing-kit-plugin-knex';
import {useVirtualModules} from 'sewing-kit-plugin-webpack-virtual-modules';

const PLUGIN = 'Watch.Api';

export default createService((service) => {
  service.entry('./index');
  service.plugins(
    createQuiltServicePlugin({devServer: {ip: 'localhost', port: 8080}}),
    createKnexPlugin({dialect: Dialect.Postgres}),
    useVirtualModules(
      ({project, api}) => ({
        [api.tmpPath(`lambda-service/${project.name}.js`)]: virtualEntryContent(
          project,
        ),
      }),
      {asEntry: true, build: false, dev: true},
    ),
    createProjectPlugin({
      id: PLUGIN,
      run({dev, build}) {
        dev.tap(PLUGIN, ({hooks}) => {
          hooks.service.tap(PLUGIN, ({hooks}) => {
            hooks.configure.tap(PLUGIN, (configure) => {
              configure.webpackConfig?.tap(PLUGIN, (config) => {
                return {
                  ...config,
                  resolve: {
                    ...config.resolve,
                    alias: {
                      ...config.resolve?.alias,
                      'any-promise': require.resolve(
                        '../../config/sewing-kit/stubs/any-promise.js',
                      ),
                    },
                  },
                };
              });
            });
          });
        });

        build.tap(PLUGIN, ({hooks}) => {
          hooks.service.tap(PLUGIN, ({hooks}) => {
            hooks.configure.tap(PLUGIN, (configure) => {
              configure.webpackOutputFilename?.tap(PLUGIN, () => 'index.js');
              configure.webpackConfig?.tap(PLUGIN, (config) => {
                return {
                  ...config,
                  resolve: {
                    ...config.resolve,
                    alias: {
                      ...config.resolve?.alias,
                      'any-promise': require.resolve(
                        '../../config/sewing-kit/stubs/any-promise.js',
                      ),
                    },
                  },
                };
              });
            });
          });
        });
      },
    }),
  );
});

function virtualEntryContent(project: Project) {
  return `
    import Koa from 'koa';
    import bodyParser from 'koa-bodyparser';
    import handler from ${JSON.stringify(project.fs.resolvePath('index'))};
    
    const app = new Koa();

    app.use(bodyParser());
    app.use(async (ctx) => {
      const {body, statusCode = 200, headers = {}} = await handler({body: JSON.stringify(ctx.request.body)});
      ctx.status = statusCode;
      
      for (const [header, value] of Object.entries(headers)) {
        ctx.set(header, value);
      }

      ctx.body = body;
    });

    app.listen(process.env.PORT, process.env.IP, () => {
      console.log(\`listening on \${process.env.IP}:\${process.env.PORT}\`);
    });
  `;
}
