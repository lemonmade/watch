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

import {CDN_ROOT} from '../config/deploy/constants';

export default createWebApp((app) => {
  app.entry('./index');
  app.use(
    quiltWebApp({
      // eslint-disable-next-line no-warning-comments
      // TODO: this option doesn't work with fast refresh because it still configures
      // react-refresh
      // preact: true,
      autoServer: false,
      assetServer: false,
      cdn: CDN_ROOT,
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
            const {createServer} = await import('vite');

            const server = await createServer({
              configFile: false,
              clearScreen: false,
              cacheDir: api.cachePath('vite'),
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
              // esbuild:
              plugins: [
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

                    const {
                      code: transformedCode,
                      map,
                      ast,
                    } = await transformAsync(code, {
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
                    });

                    return {code: transformedCode, map, ast};
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
                                <script defer src="@quilted/magic/browser.tsx" type="module"></script>
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

            await server.listen(3002);
          }),
        ]);

        hooks.configure.hook((configuration) => {
          // Shouldn't need this...
          configuration.webpackPublicPath?.hook(
            () => `http://localhost:3002/assets/`,
          );

          configuration.webpackAliases?.hook((aliases) => ({
            ...aliases,
            global: workspace.fs.resolvePath('global'),
          }));
        });
      });

      tasks.build.hook(({hooks}) => {
        hooks.target.hook(({hooks}) => {
          hooks.configure.hook((configuration) => {
            configuration.webpackAliases?.hook((aliases) => ({
              ...aliases,
              global: workspace.fs.resolvePath('global'),
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
