import {createService} from '@sewing-kit/config';
import {
  Task,
  Service,
  createProjectBuildPlugin,
  createComposedProjectPlugin,
} from '@sewing-kit/plugins';
import {quiltService} from '@quilted/sewing-kit-plugins';
import {webpackAliases} from '@sewing-kit/plugin-webpack';

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
    simpleLambda(),
  );
});

function simpleLambda() {
  return createComposedProjectPlugin<Service>(`${PLUGIN}.SimpleLambda`, [
    virtualModules(
      ({project, api}) => ({
        [api.tmpPath(`lambda-service/${project.name}.js`)]: virtualEntryContent(
          project,
        ),
      }),
      {asEntry: true, include: [Task.Dev]},
    ),
    createProjectBuildPlugin(`${PLUGIN}.SetWebpackFilename`, ({hooks}) => {
      hooks.target.hook(({hooks}) => {
        hooks.configure.hook((configure) => {
          configure.webpackOutputFilename?.hook(() => 'index.js');
        });
      });
    }),
  ]);
}

function virtualEntryContent(service: Service) {
  return `
    import Koa from 'koa';
    import bodyParser from 'koa-bodyparser';
    import handler from ${JSON.stringify(service.fs.resolvePath('index'))};

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
