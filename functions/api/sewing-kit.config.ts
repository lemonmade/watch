import {createService} from '@sewing-kit/config';
import {
  //   Task,
  //   Service,
  createProjectDevPlugin,
  //   createComposedProjectPlugin,
} from '@sewing-kit/plugins';
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
    quiltService({devServer: false, features: ['base', 'fetch']}),
    knex(),
    webpackAliases({'any-promise': anyPromiseStub}),
    noopModuleWithWebpack(/vue-template-compiler/),
    lambda(),
    functionConvenienceAliases(),
    // lambdaDev(),
    createProjectDevPlugin(
      `Quilt.ESBuild`,
      ({hooks, api, project, workspace}) => {
        hooks.steps.hook((steps) => [
          ...steps,
          api.createStep(
            {id: 'Quilt.ESBuild', label: 'ESBuild'},
            async (step) => {
              const {build} = await import('esbuild');

              const entryPath = api.tmpPath(
                'esbuild',
                project.name,
                'index.js',
              );

              await api.write(
                entryPath,
                `
                  import '@quilted/polyfills/fetch.node';
                  import {createHttpServer} from '@quilted/http-handlers/node';
                  import handler from ${JSON.stringify(
                    project.fs.resolvePath(project.entry!),
                  )};

                  createHttpServer(handler).listen(8910, () => {
                    console.log('listening on localhost:8910');
                  });
                `,
              );

              const file = workspace.fs.buildPath(
                'esbuild',
                project.name,
                'index.js',
              );

              await build({
                bundle: true,
                platform: 'node',
                target: 'node12',
                entryPoints: [entryPath],
                mainFields: ['esnext', 'module', 'main'],
                conditions: ['esnext'],
                resolveExtensions: [
                  '.esnext',
                  '.tsx',
                  '.ts',
                  '.jsx',
                  '.js',
                  '.json',
                ],
                outfile: file,
                watch: {
                  onRebuild(error, result) {
                    console.log(error, result);
                  },
                },
                external: ['knex', '@graphql-tools/*', 'aws-sdk'],
                loader: {
                  '.esnext': 'js',
                },
                define: {
                  'process.env.NODE_ENV': JSON.stringify('development'),
                },
                plugins: [
                  {
                    name: '@quilted/aliases',
                    setup(build) {
                      build.onResolve({filter: /^shared\//}, ({path}) => {
                        return {
                          path: workspace.fs.resolvePath(
                            'functions',
                            `${path}.ts`,
                          ),
                        };
                      });
                    },
                  },
                ],
              });

              await step.exec('node', [file], {stdio: 'inherit'});
            },
          ),
        ]);

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
      },
    ),
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
