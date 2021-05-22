import {createWebApp} from '@sewing-kit/config';
import {WebApp, createProjectPlugin} from '@sewing-kit/plugins';
import {quiltWebApp} from '@quilted/sewing-kit-plugins';
import {lambda} from '@quilted/aws/sewing-kit';

export default createWebApp((app) => {
  console.log(app);
  app.entry('./index');
  try {
    app.use(
      quiltWebApp({
        autoServer: true,
        cdn: 'https://watch.lemon.tools/assets/app/',
        browserGroups: ['evergreen', 'latest-chrome'],
        polyfill: {features: ['base', 'fetch']},
      }),
      lambda(),
      randomBits(),
    );
  } catch (error) {
    console.log(error);
  }
});

function randomBits() {
  return createProjectPlugin<WebApp>(
    'Watch.App.Etcetera',
    ({tasks, project, workspace, api}) => {
      tasks.dev.hook(({hooks}) => {
        hooks.steps.hook((steps) => [
          ...steps,
          api.createStep({id: 'Quilt.Vite', label: 'Run vite'}, async () => {
            const [
              {createServer},
              {default: prefresh},
              {workers},
              {graphql},
              {default: json},
              {default: commonjs},
              {default: nodeResolve},
              {default: esbuild},
            ] = await Promise.all([
              import('vite'),
              import('@prefresh/vite'),
              import('@quilted/workers/rollup'),
              import('@quilted/graphql/rollup'),
              import('@rollup/plugin-json'),
              import('@rollup/plugin-commonjs'),
              import('@rollup/plugin-node-resolve'),
              import('rollup-plugin-esbuild'),
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
                workers({
                  publicPath: `/@fs${workspace.fs.buildPath(
                    'vite/workers',
                    project.name,
                  )}`,
                  inputOptions: (options) => ({...options, treeshake: false}),
                  outputOptions: (options) => ({
                    ...options,
                    dir: workspace.fs.buildPath('vite/workers', project.name),
                  }),
                  plugins: [
                    json(),
                    nodeResolve({
                      exportConditions: [
                        'esnext',
                        'import',
                        'require',
                        'default',
                      ],
                      extensions: [
                        '.tsx',
                        '.ts',
                        '.esnext',
                        '.mjs',
                        '.js',
                        '.json',
                      ],
                      preferBuiltins: true,
                    }),
                    commonjs(),
                    esbuild({
                      target: 'node14',
                      loaders: {
                        '.esnext': 'js',
                      },
                    }),
                  ],
                }),
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
                // Also adds our worker plugin
                {
                  name: '@quilt/esbuild-with-pre-babel',
                  enforce: 'pre',
                  async transform(code, id) {
                    if (!id.endsWith('.tsx') && !id.endsWith('.ts')) {
                      return null;
                    }

                    const {transformAsync} = await import('@babel/core');

                    const {code: transformedCode, map} =
                      (await transformAsync(code, {
                        filename: id,
                        configFile: false,
                        babelrc: false,
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
                          '@quilted/workers/babel',
                        ],
                      })) ?? {};

                    return {code: transformedCode ?? undefined, map};
                  },
                },
                graphql(),
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
    },
  );
}
