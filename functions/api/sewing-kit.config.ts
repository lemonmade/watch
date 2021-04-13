import {createService} from '@sewing-kit/config';
// import {
//   Task,
//   Service,
//   createProjectDevPlugin,
//   createComposedProjectPlugin,
// } from '@sewing-kit/plugins';
import {quiltService} from '@quilted/sewing-kit-plugins';
import {lambda} from '@quilted/aws/sewing-kit';
import {
  webpackAliases,
  noopModuleWithWebpack,
} from '@sewing-kit/plugin-webpack';

// import {virtualModules} from 'sewing-kit-plugin-webpack-virtual-modules';

import {
  knex,
  functionConvenienceAliases,
} from '../../config/sewing-kit/plugins';

// const PLUGIN = 'Watch.Api';

const anyPromiseStub = require.resolve(
  '../../config/sewing-kit/stubs/any-promise.js',
);

export default createService((service) => {
  service.entry('./index');
  service.use(
    // quiltService({devServer: {ip: 'localhost', port: 8080}}),
    quiltService({devServer: false}),
    knex(),
    webpackAliases({'any-promise': anyPromiseStub}),
    noopModuleWithWebpack(/vue-template-compiler/),
    lambda(),
    functionConvenienceAliases(),
    // lambdaDev(),
  );
});

// function lambdaDev() {
//   return createComposedProjectPlugin<Service>(`${PLUGIN}.SimpleLambda`, [
//     virtualModules(
//       ({project, api}) => {
//         const entry = project.fs.resolvePath(project.entry ?? 'index');

//         return {
//           [api.tmpPath(`lambda-service/${project.name}.js`)]: `
//             import Koa from 'koa';
//             import bodyParser from 'koa-bodyparser';
//             import * as handlerModule from ${JSON.stringify(entry)};

//             const handler = getHandler();
//             const app = new Koa();

//             app.use(bodyParser());
//             app.use(async (ctx) => {
//               const {body, statusCode = 200, headers = {}} = await handler({body: JSON.stringify(ctx.request.body)});
//               ctx.status = statusCode;

//               for (const [header, value] of Object.entries(headers)) {
//                 ctx.set(header, value);
//               }

//               ctx.body = body;
//             });

//             app.listen(process.env.PORT, process.env.IP, () => {
//               console.log(\`listening on \${process.env.IP}:\${process.env.PORT}\`);
//             });

//             function getHandler() {
//               if (typeof handlerModule.default === 'function') return handlerModule.default;
//               if (typeof handlerModule.handler === 'function') return handlerModule.handler;
//               if (typeof handlerModule.main === 'function') return handlerModule.main;

//               throw new Error('No handler found in module ' + ${JSON.stringify(
//                 entry,
//               )});
//             }
//           `,
//         };
//       },
//       {asEntry: true, include: [Task.Dev]},
//     ),
//     createProjectDevPlugin(`${PLUGIN}.SetWebpackFilename`, ({hooks}) => {
//       hooks.configure.hook((configure) => {
//         configure.webpackOutputFilename?.hook(() => 'index.js');
//         configure.webpackConfig?.hook((config) => ({
//           ...config,
//           output: {
//             ...config.output,
//             libraryTarget: 'commonjs2',
//           },
//         }));
//       });
//     }),
//   ]);
// }
