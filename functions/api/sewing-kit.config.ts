import {createService} from '@sewing-kit/config';
import {Project} from '@sewing-kit/model';
import {createQuiltServicePlugin} from '@quilted/sewing-kit-plugins';

import {createKnexPlugin, Dialect} from 'sewing-kit-plugin-knex';
import {useVirtualModules} from 'sewing-kit-plugin-webpack-virtual-modules';

import {} from '@sewing-kit/plugin-webpack';

export default createService((service) => {
  service.entry('./index');
  service.plugins(
    createQuiltServicePlugin({devServer: {ip: 'localhost', port: 8080}}),
    createKnexPlugin({dialect: Dialect.Postgres}),
    useVirtualModules(
      ({project, api}) => ({
        [api.tmpPath(`lambda-service/${service.name}.js`)]: virtualEntryContent(
          project,
        ),
      }),
      {asEntry: true},
    ),
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
