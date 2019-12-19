import {createService} from '@sewing-kit/config';
import {
  createProjectDevPlugin,
  createProjectBuildPlugin,
} from '@sewing-kit/plugins';
import {Service} from '@sewing-kit/model';
import {quiltServicePlugin} from '@quilted/sewing-kit-plugins';

import {} from '@sewing-kit/plugin-webpack';

import WebpackVirtualModules from 'webpack-virtual-modules';

const PLUGIN = 'Watch.Api';

export default createService((service) => {
  service.entry('./index');
  service.plugin(quiltServicePlugin);

  service.plugin(
    createProjectBuildPlugin(PLUGIN, ({hooks}, api) => {
      hooks.service.tap(PLUGIN, ({hooks, service}) => {
        const virtualEntry = api.configPath(
          `lambda-service/${service.name}.js`,
        );

        hooks.configure.tap(PLUGIN, (configure) => {
          configure.webpackEntries?.tap(PLUGIN, () => [virtualEntry]);

          configure.webpackPlugins?.tap(PLUGIN, (plugins) => [
            ...plugins,
            new WebpackVirtualModules({
              [virtualEntry]: virtualEntryContent(service),
            }),
          ]);
        });
      });
    }),
  );

  service.plugin(
    createProjectDevPlugin(PLUGIN, ({hooks}, api) => {
      hooks.service.tap(PLUGIN, ({hooks, service}) => {
        hooks.configure.tap(PLUGIN, (configure) => {
          configure.port.tap(PLUGIN, () => 8080);
          configure.ip.tap(PLUGIN, () => 'localhost');

          const virtualEntry = api.configPath(
            `lambda-service/${service.name}.js`,
          );

          configure.webpackEntries?.tap(PLUGIN, () => [virtualEntry]);

          configure.webpackPlugins?.tap(PLUGIN, (plugins) => [
            ...plugins,
            new WebpackVirtualModules({
              [virtualEntry]: virtualEntryContent(service),
            }),
          ]);
        });
      });
    }),
  );
});

function virtualEntryContent(service: Service) {
  return `
    import Koa from 'koa';
    import bodyParser from 'koa-bodyparser';
    import handler from ${JSON.stringify(service.fs.resolvePath('index'))};
    
    const app = new Koa();

    app.use(bodyParser());
    app.use(async (ctx) => {
      const {body, statusCode = 200, headers = {}} = await handler({body: ctx.request.body});
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
