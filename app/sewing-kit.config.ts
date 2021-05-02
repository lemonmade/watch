import {readFile} from 'fs/promises';

import {createWebApp} from '@sewing-kit/config';
import {
  Runtime,
  WebApp,
  createProjectPlugin,
  createProjectBuildPlugin,
} from '@sewing-kit/plugins';
import {quiltWebApp} from '@quilted/sewing-kit-plugins';
import {lambda} from '@quilted/aws/sewing-kit';
import type {BuildWebAppTargetOptions} from '@sewing-kit/hooks';
import type {} from '@sewing-kit/plugin-webpack';

import type {TransformPluginContext} from 'rollup';

export default createWebApp((app) => {
  app.entry('./index');
  app.use(
    quiltWebApp({
      preact: true,
      autoServer: true,
      assetServer: false,
      cdn: 'https://watch.lemon.tools/assets/app/',
      features: ['base', 'fetch'],
      browserGroups: ['evergreen', 'latest-chrome'],
    }),
    lambda(),
    randomBits(),
    bundleAnalyzer(),
  );
});

function randomBits() {
  return createProjectPlugin<WebApp>(
    'Watch.App.Etcetera',
    ({tasks, project, workspace, api}) => {
      tasks.dev.hook(({hooks}) => {
        hooks.steps.hook((steps) => [
          ...steps,
          api.createStep({id: 'Quilt.Vite', label: 'Run vite'}, async () => {
            const [{createServer}, {default: prefresh}] = await Promise.all([
              import('vite'),
              import('@prefresh/vite'),
            ]);

            const server = await createServer({
              configFile: false,
              clearScreen: false,
              cacheDir: api.cachePath('vite'),
              server: {
                port: 8912,
                hmr: {
                  protocol: 'ws',
                  host: 'localhost',
                },
              },
              resolve: {
                conditions: [
                  'esnext',
                  'import',
                  'module',
                  'browser',
                  'default',
                ],
                extensions: [
                  '.esnext',
                  '.mjs',
                  '.js',
                  '.ts',
                  '.jsx',
                  '.tsx',
                  '.json',
                ],
                mainFields: ['esnext', 'module', 'jsnext:main', 'jsnext'],
                alias: {
                  // App
                  utilities: project.fs.resolvePath('utilities'),
                  components: project.fs.resolvePath('components'),
                  global: workspace.fs.resolvePath('global'),
                  // React
                  'react/jsx-runtime': 'preact/jsx-runtime',
                  react: '@quilted/preact-mini-compat',
                  'react-dom/server': 'preact/compat/server',
                  'react-dom': '@quilted/preact-mini-compat',
                  'preact/jsx-dev-runtime': 'preact/jsx-runtime',
                },
              },
              esbuild: {
                // @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/esbuild.ts#L92-L95
                include: /\.(tsx?|jsx|esnext)$/,
                // Vite uses the extension as the loader, which fails for esnext. Would be nice to have a per-file
                // API for this...
                loader: 'ts',
              },
              plugins: [
                prefresh(),
                {
                  name: '@quilted/magic/browser',
                  resolveId(id) {
                    if (id === '/@quilted/magic/browser.tsx') {
                      return id;
                    }
                  },
                  load(id) {
                    if (id === '/@quilted/magic/browser.tsx') {
                      const appEntry = project.fs.resolvePath(project.entry!);

                      return `
                        import {render} from 'react-dom';
                        import * as AppModule from ${JSON.stringify(appEntry)};

                        const App = getAppComponent();

                        render(<App />, document.getElementById('app'));
        
                        function getAppComponent() {
                          if (typeof AppModule.default === 'function') return AppModule.default;
                          if (typeof AppModule.App === 'function') return AppModule.App;
                        
                          const firstFunction = Object.keys(AppModule)
                            .map((key) => AppModule[key])
                            .find((exported) => typeof exported === 'function');
                        
                          if (firstFunction) return firstFunction;
                        
                          throw new Error('No App component found in module: ' + ${JSON.stringify(
                            appEntry,
                          )});
                        }
                      `;
                    }
                  },
                },
                // Preprocesses .tsx files with the JSX transform because ESBuild does not
                // support it natively:
                // https://github.com/evanw/esbuild/issues/334
                {
                  name: '@quilt/transform-jsx-runtime',
                  enforce: 'pre',
                  async transform(code, id) {
                    if (!id.endsWith('.tsx')) {
                      return null;
                    }

                    const {transformAsync} = await import('@babel/core');

                    const {code: transformedCode, map} =
                      (await transformAsync(code, {
                        filename: id,
                        configFile: false,
                        presets: [
                          [
                            '@babel/preset-react',
                            {
                              development: true,
                              runtime: 'automatic',
                              importSource: 'preact',
                            },
                          ],
                        ],
                        plugins: [
                          ['@babel/plugin-syntax-typescript', {isTSX: true}],
                        ],
                      })) ?? {};

                    return {code: transformedCode ?? undefined, map};
                  },
                },
                {
                  name: '@quilted/graphql',
                  async transform(code, id) {
                    if (!id.endsWith('.graphql')) return null;

                    const [
                      {parse},
                      {cleanDocument, extractImports, toSimpleDocument},
                    ] = await Promise.all([
                      import('graphql'),
                      import('@sewing-kit/graphql'),
                    ]);

                    const document = toSimpleDocument(
                      cleanDocument(await loadDocument(code, id, this)),
                    );

                    return `export default JSON.parse(${JSON.stringify(
                      JSON.stringify(document),
                    )})`;

                    async function loadDocument(
                      code: string,
                      file: string,
                      plugin: TransformPluginContext,
                    ) {
                      const {imports, source} = extractImports(code);
                      const document = parse(source);

                      if (imports.length === 0) {
                        return document;
                      }

                      const resolvedImports = await Promise.all(
                        imports.map(async (imported) => {
                          const resolvedId = await plugin.resolve(
                            imported,
                            file,
                          );

                          if (resolvedId == null) {
                            throw new Error(
                              `Could not find ${JSON.stringify(
                                imported,
                              )} from ${JSON.stringify(file)}`,
                            );
                          }

                          plugin.addWatchFile(resolvedId.id);
                          const contents = await readFile(resolvedId.id, {
                            encoding: 'utf8',
                          });

                          return loadDocument(contents, resolvedId.id, plugin);
                        }),
                      );

                      for (const {definitions} of resolvedImports) {
                        (document.definitions as any[]).push(...definitions);
                      }

                      return document;
                    }
                  },
                },
                {
                  name: 'quilt',
                  configureServer(server) {
                    server.middlewares.use(async (request, response, next) => {
                      try {
                        const accept = request.headers.accept ?? '';
                        if (!accept.includes('text/html')) return next();

                        const url = new URL(
                          `${
                            request.headers['x-forwarded-proto'] ?? 'http'
                          }://${
                            request.headers['x-forwarded-host'] ??
                            request.headers.host
                          }${request.originalUrl}`,
                        );

                        const template = await server.transformIndexHtml(
                          url.href,
                          `
                            <html>
                              <body>
                                <div id="app"></div>
                                <script defer src="/@quilted/magic/browser.tsx" type="module"></script>
                              </body>
                            </html>
                          `,
                        );

                        response.setHeader('Content-Type', 'text/html');
                        response.end(template);
                      } catch (error) {
                        server.ssrFixStacktrace(error);
                        next(error);
                      }
                    });
                  },
                },
              ],
            });

            await server.listen();
          }),
        ]);
      });

      tasks.build.hook(({hooks}) => {
        hooks.target.hook(({hooks}) => {
          hooks.configure.hook((configuration) => {
            configuration.webpackAliases?.hook((aliases) => ({
              ...aliases,
              global: workspace.fs.resolvePath('global'),
              // Fixes an issue where preact-render-to-string imports preact,
              // which brings in a different build of preact in the bundle.
              'preact-render-to-string$':
                'preact-render-to-string/dist/index.mjs',
              preact$: 'preact/dist/preact.module.js',
            }));
          });
        });
      });
    },
  );
}

function bundleAnalyzer() {
  return createProjectBuildPlugin<WebApp>('Watch.BundleAnalyzer', ({hooks}) => {
    hooks.target.hook(({target, hooks}) => {
      hooks.configure.hook((configuration) => {
        if (
          target.runtime.includes(Runtime.Browser) ||
          target.runtime.includes(Runtime.WebWorker)
        ) {
          configuration.webpackPlugins?.hook(async (plugins) => {
            const {
              BundleAnalyzerPlugin,
              // eslint-disable-next-line @typescript-eslint/no-var-requires
            } = require('webpack-bundle-analyzer');

            return process.env.CI
              ? plugins
              : [
                  ...plugins,
                  new BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    generateStatsFile: true,
                    openAnalyzer: false,
                    reportFilename: `report.${
                      idFromTargetOptions(target.options) || 'default'
                    }.html`,
                  }),
                ];
          });
        }
      });
    });
  });
}

export function idFromTargetOptions(options: BuildWebAppTargetOptions) {
  return (
    Object.keys(options)
      .sort()
      .map((key) => {
        const value = (options as any)[key];

        switch (key as keyof typeof options) {
          case 'quiltAutoServer':
            return undefined;
          case 'browsers':
            return value;
          default: {
            if (typeof value === 'boolean') {
              return value ? key : `no-${key}`;
            }

            return value;
          }
        }
      })
      .filter(Boolean)
      .join('.') || 'default'
  );
}
