import {createService} from '@sewing-kit/config';
import {
  Task,
  Service,
  createProjectPlugin,
  createComposedProjectPlugin,
} from '@sewing-kit/plugins';
import {quiltService} from '@quilted/sewing-kit-plugins';
import {
  webpackAliases,
  noopModuleWithWebpack,
} from '@sewing-kit/plugin-webpack';

import {knex, Dialect} from 'sewing-kit-plugin-knex';
import {virtualModules} from 'sewing-kit-plugin-webpack-virtual-modules';

const PLUGIN = 'Watch.Api';

const anyPromiseStub = require.resolve(
  '../../config/sewing-kit/stubs/any-promise.js',
);

export default createService((service) => {
  service.entry('./index');
  service.use(
    quiltService({devServer: {ip: 'localhost', port: 8080}}),
    knex({dialect: Dialect.Postgres}),
    webpackAliases({'any-promise': anyPromiseStub}),
    noopModuleWithWebpack(/vue-template-compiler/),
    simpleLambda(),
  );
});

function simpleLambda() {
  return createComposedProjectPlugin<Service>(`${PLUGIN}.SimpleLambda`, [
    virtualModules(
      ({project, api}) => ({
        [api.tmpPath(`lambda-service/${project.name}.js`)]: virtualEntryContent(
          project,
          Task.Dev,
        ),
      }),
      {asEntry: true, include: [Task.Dev]},
    ),
    virtualModules(
      ({project, api}) => ({
        [api.tmpPath(`lambda-service/${project.name}.js`)]: virtualEntryContent(
          project,
          Task.Build,
        ),
      }),
      {asEntry: true, include: [Task.Build]},
    ),
    createProjectPlugin(
      `${PLUGIN}.SetWebpackFilename`,
      ({tasks: {dev, build}}) => {
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

        dev.hook(({hooks}) => {
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
      },
    ),
  ]);
}

function virtualEntryContent(service: Service, task: Task) {
  const serviceEntry = service.fs.resolvePath(service.entry ?? 'index');

  if (task === Task.Build) {
    return `
      import * as handlerModule from ${JSON.stringify(serviceEntry)};

      const handler = getHandler();

      export {handler};

      function getHandler() {
        if (typeof handlerModule.default === 'function') return handlerModule.default;
        if (typeof handlerModule.handler === 'function') return handlerModule.handler;
        if (typeof handlerModule.main === 'function') return handlerModule.main;

        throw new Error('No handler found in module ' + ${JSON.stringify(
          serviceEntry,
        )});
      }
    `;
  }

  return `
    import Koa from 'koa';
    import bodyParser from 'koa-bodyparser';
    import * as handlerModule from ${JSON.stringify(serviceEntry)};

    const handler = getHandler();
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

    function getHandler() {
      if (typeof handlerModule.default === 'function') return handlerModule.default;
      if (typeof handlerModule.handler === 'function') return handlerModule.handler;
      if (typeof handlerModule.main === 'function') return handlerModule.main;

      throw new Error('No handler found in module ' + ${JSON.stringify(
        serviceEntry,
      )});
    }
  `;
}
