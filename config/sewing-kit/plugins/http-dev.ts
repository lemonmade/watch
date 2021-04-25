import {createProjectDevPlugin, Service} from '@sewing-kit/plugins';

export function httpDev({port}: {port: number}) {
  return createProjectDevPlugin<Service>(
    `Quilt.ESBuild`,
    ({hooks, api, project}) => {
      hooks.steps.hook((steps) => [
        ...steps,
        api.createStep(
          {
            id: 'Watch.HttpDev',
            label: `Run local HTTP development server for ${project.name}`,
          },
          async (step) => {
            const {build} = await import('esbuild');

            const entryPath = api.tmpPath('esbuild', project.name, 'index.js');

            await api.write(
              entryPath,
              `
                import 'dotenv/config';
                import '@quilted/polyfills/fetch.node';
                import {createHttpServer} from '@quilted/http-handlers/node';
                import handler from ${JSON.stringify(
                  project.fs.resolvePath(project.entry!),
                )};
  
                createHttpServer(handler).listen(Number.parseInt(process.env.PORT, 10), () => {
                  console.log('listening on localhost:' + process.env.PORT);
                });
              `,
            );

            const file = api.tmpPath('esbuild', project.name, 'built.js');

            let server: ReturnType<typeof step['exec']> | undefined;

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
                onRebuild(error) {
                  if (error) {
                    // eslint-disable-next-line no-console
                    console.error(error);
                    return;
                  }

                  try {
                    server?.kill();
                  } catch {
                    // intentional noop
                  }

                  server = step.exec('node', [file], {stdio: 'inherit'});
                },
              },
              external: [
                'knex',
                'graphql',
                '@graphql-tools/*',
                'aws-sdk',
                'dotenv',
                // this is some random, deeply nested require in the prisma runtime
                '_http_common',
                '@prisma/client',
              ],
              loader: {
                '.esnext': 'js',
              },
              define: {
                'process.env.NODE_ENV': JSON.stringify('development'),
                'process.env.PORT': JSON.stringify(String(port)),
              },
              plugins: [
                {
                  name: '@quilted/graphql',
                  setup(build) {
                    build.onLoad({filter: /\.graphql$/}, async ({path}) => {
                      const [
                        {readFile},
                        {parse},
                        {cleanDocument, toSimpleDocument},
                      ] = await Promise.all([
                        import('fs/promises'),
                        import('graphql'),
                        import('@sewing-kit/graphql'),
                      ]);

                      const source = await readFile(path, {encoding: 'utf8'});

                      return {
                        contents: JSON.stringify(
                          toSimpleDocument(cleanDocument(parse(source))),
                        ),
                        loader: 'json',
                      };
                    });
                  },
                },
              ],
            });

            server = step.exec('node', [file], {stdio: 'inherit'});
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
  );
}
