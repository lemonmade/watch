import {createServer} from 'http';
import * as URL from 'url';

import {join, dirname, extname} from 'path';
import {createWebApp} from '@sewing-kit/config';
import {
  Runtime,
  WebApp,
  createProjectDevPlugin,
  createProjectBuildPlugin,
  createComposedProjectPlugin,
} from '@sewing-kit/plugins';
import {quiltWebApp} from '@quilted/sewing-kit-plugins';
import {graphql} from '@sewing-kit/plugin-graphql';
import {createCSSWebpackRuleSet} from '@sewing-kit/plugin-css';
import {
  createJavaScriptWebpackRuleSet,
  updateSewingKitBabelPreset,
} from '@sewing-kit/plugin-javascript';
import {webpackBuild, createWebpackConfig} from '@sewing-kit/plugin-webpack';

// mostly the same as Sewing Kit’s asset metadata plugin
// (https://github.com/Shopify/sewing-kit/tree/master/packages/webpack-asset-metadata-plugin)
// but trimmed down and suitable for Checkout’s "render the HTML in shopify/shopify"
// production deploy.

import {mkdirp, writeFile} from 'fs-extra';
import type {Compiler, Plugin, compilation} from 'webpack';

export default createWebApp((app) => {
  app.entry('./index');
  app.use(
    quiltWebApp(),
    graphql(),
    webpackBuild(),
    webAppAutoServer(),
    createProjectDevPlugin('Watch.App.Dev', ({api, hooks, project}) => {
      hooks.configure.hook((configuration) => {
        configuration.webpackAliases?.hook((aliases) => {
          return {
            ...aliases,
            components$: project.fs.resolvePath('components'),
          };
        });
      });

      hooks.steps.hook((steps, {webpackBuildManager}) => [
        ...steps,
        api.createStep(
          {
            label: 'starting stating HTML development server',
            id: 'StaticHtml.DevServer',
          },
          async (step) => {
            const currentAssets = new Set<string>();

            webpackBuildManager?.on(
              project,
              (stats: import('webpack').Stats) => {
                const {publicPath, assets = []} = stats.toJson({
                  assets: true,
                  publicPath: true,
                });

                currentAssets.clear();

                for (const asset of assets) {
                  if (asset.name.endsWith('.map')) {
                    continue;
                  }

                  if (publicPath == null) {
                    currentAssets.add(asset.name);
                  } else {
                    currentAssets.add(
                      publicPath.endsWith('/')
                        ? `${publicPath}${asset.name}`
                        : `${publicPath}/${asset.name}`,
                    );
                  }
                }
              },
            );

            step.indefinite(({stdio}) => {
              createServer((req, res) => {
                stdio.stdout.write(`request for path: ${req.url}\n`);

                res.writeHead(200, {
                  'Content-Type': 'text/html',
                  // 'Content-Security-Policy':
                  //   "default-src http://* https://* 'unsafe-eval'",
                });
                res.write(
                  `<html>
                    <head></head>
                    <body>
                      <div id="app"></div>
                      ${[...currentAssets]
                        .map(
                          (asset) =>
                            `<script src=${JSON.stringify(asset)}></script>`,
                        )
                        .join('\n')}
                    </body>
                  </html>`,
                );
                res.end();
              }).listen(8082);
            });
          },
        ),
      ]);
    }),
  );
});

declare module '@sewing-kit/hooks' {
  interface BuildWebAppOptions {
    readonly quiltAutoServer: true;
  }
}

function webAppAutoServer() {
  return createProjectBuildPlugin<WebApp>(
    'Quilt.WebAppAutoServer',
    ({project, workspace, hooks, api, options}) => {
      const appEntry = project.fs.resolvePath(project.entry ?? 'index');

      hooks.steps.hook((steps, configuration, context) => {
        const polyfills = api.tmpPath(`quilt/${project.name}-polyfills.js`);
        const entry = api.tmpPath(`quilt/${project.name}.js`);

        return [
          ...steps,
          api.createStep(
            {
              id: 'Quilt.WebAppAutoServer.Build',
              label: 'Build magic server renderer',
            },
            async (step) => {
              const [stats] = [...context.project.webpackStats!.values()];

              const entrypoints = [
                ...stats.compilation.entrypoints.keys(),
              ].reduce<{[key: string]: Entrypoint}>(
                (entries, name) => ({
                  ...entries,
                  [name]: getChunkDependencies(stats.compilation, name),
                }),
                {},
              );

              const [
                {default: WebpackVirtualModules},
                {default: webpack},
                cssRule,
              ] = await Promise.all([
                import('webpack-virtual-modules'),
                import('webpack'),
                createCSSWebpackRuleSet({
                  env: options.simulateEnv,
                  configuration,
                  api,
                  project,
                  cacheDependencies: [],
                  cacheDirectory: 'auto-server-css',
                  sourceMaps: options.sourceMaps,
                  runtimes: [Runtime.Node],
                  postcss: false,
                }),
              ]);

              const config = await createWebpackConfig({
                api,
                project,
                workspace,
                hooks: configuration,
                env: options.simulateEnv,
                sourceMaps: options.sourceMaps,
                runtimes: [Runtime.Node],
              });

              const updatedConfig: typeof config = {
                ...config,
                entry,
                output: {
                  ...config.output,
                  path: join(config.output?.path!, 'auto-server'),
                },
                module: {
                  ...config.module,
                  rules: [
                    ...(config.module?.rules ?? []),
                    // This is a very shitty part of the current way sewing-kit works.
                    // The CSS plugin would know how to add the rule for this this server,
                    // but that only runs for a "variant", because the variant is the thing
                    // that attaches the runtime. Needs to change.
                    {
                      test: /\.css$/,
                      use: cssRule,
                    } as import('webpack').RuleSetRule,
                  ],
                },
                plugins: [
                  ...(config.plugins ?? []),
                  new WebpackVirtualModules({
                    [polyfills]: `
                      import 'regenerator-runtime/runtime';
                      import fetch from 'node-fetch';
    
                      if (!global.fetch) {
                        global.fetch = fetch;
                        global.Response = fetch.Response;
                        global.Headers = fetch.Headers;
                        global.Request = fetch.Request;
                      }
                    `,
                    [entry]: `
                      import ${JSON.stringify(polyfills)};
    
                      import React from 'react';
                      import Koa from 'koa';
                      import mount from 'koa-mount';
                      import serve from 'koa-static';
                      import {render, stream, Html} from '@quilted/quilt/server';
    
                      import * as AppModule from ${JSON.stringify(appEntry)};
    
                      process.on('uncaughtException', (...args) => {
                        console.log(...args);
                      });
                      
                      const App = getAppComponent(AppModule);
                      const server = new Koa();

                      server.use(
                        mount('/assets', serve('build/app'))
                      );
                      
                      server.use(async (ctx) => {
                        const {html, markup, asyncAssets} = await render(<App url={ctx.URL} />);
                      
                        ctx.type = 'html';
                        ctx.body = stream(
                          <Html
                            manager={html}
                            styles={${JSON.stringify(entrypoints.main.css)}}
                            scripts={${JSON.stringify(entrypoints.main.js)}}
                            preloadAssets={[]}
                          >
                            {markup}
                          </Html>,
                        );
                      });
                      
                      server.listen(process.env.PORT, process.env.IP, () => {
                        console.log(\`listening on \${process.env.IP}:\${process.env.PORT}\`);
                      });
                      
                      function getAppComponent(AppModule) {
                        if (typeof AppModule.default === 'function') return AppModule.default;
                        if (typeof AppModule.App === 'function') return AppModule.App;
                      
                        const firstFunction = Object.keys(AppModule)
                          .map((key) => AppModule[key])
                          .find((exported) => typeof exported === 'function');
                      
                        if (firstFunction) return firstFunction;
                      
                        throw new Error(\`No App component found in module: ${JSON.stringify(
                          appEntry,
                        )}\`);
                      }
                    `,
                  }),
                ],
              };

              const compiler = webpack(updatedConfig);

              await new Promise<import('webpack').Stats>((resolve, reject) => {
                compiler.run((error, stats) => {
                  if (error) {
                    reject(error);
                    return;
                  }

                  if (stats.hasErrors()) {
                    reject(new Error(stats.toString('errors-warnings')));
                    return;
                  }

                  const entrypoints = [
                    ...stats.compilation.entrypoints.keys(),
                  ].reduce<{[key: string]: Entrypoint}>(
                    (entries, name) => ({
                      ...entries,
                      [name]: getChunkDependencies(stats.compilation, name),
                    }),
                    {},
                  );

                  step.log(JSON.stringify(entrypoints, null, 2));

                  resolve(stats);
                });
              });

              step.log('Compiled successfully!');
            },
          ),
        ];
      });

      hooks.variants.hook(() => [{}]);

      hooks.variant.hook(({hooks}) => {
        hooks.configure.hook((configuration) => {
          const entry = api.tmpPath(`quilt/${project.name}-client.js`);

          configuration.webpackEntries?.hook(() => [entry]);

          configuration.webpackPlugins?.hook(async (plugins) => {
            const {default: WebpackVirtualModules} = await import(
              'webpack-virtual-modules'
            );

            return [
              ...plugins,
              new WebpackVirtualModules({
                [entry]: `
                  import 'regenerator-runtime/runtime';
                  import React from 'react';
                  import {render} from 'react-dom';
                  import * as AppModule from ${JSON.stringify(appEntry)};

                  const App = getAppComponent(AppModule);

                  render(<App />, document.getElementById('app'));
                  
                  function getAppComponent(AppModule) {
                    if (typeof AppModule.default === 'function') return AppModule.default;
                    if (typeof AppModule.App === 'function') return AppModule.App;
                  
                    const firstFunction = Object.keys(AppModule)
                      .map((key) => AppModule[key])
                      .find((exported) => typeof exported === 'function');
                  
                    if (firstFunction) return firstFunction;
                  
                    throw new Error(\`No App component found in module: ${JSON.stringify(
                      appEntry,
                    )}\`);
                  }
                `,
              }),
            ];
          });
        });
      });
    },
  );
}

interface Chunk {
  path: string;
  integrity?: string;
}

interface Entrypoint {
  js: Chunk[];
  css: Chunk[];
}

interface AsyncManifestEntry {
  path: string;
  integrity?: string;
}

interface AsyncManifest {
  [key: string]: AsyncManifestEntry[];
}

interface Options {
  id: string;
  variant: AssetVariant;
  filename?: string;
}

interface AssetVariant {
  [key: string]: any;
}

export interface AssetManifest {
  id: string;
  variant: AssetVariant;
  version: string;
  entrypoints: {[key: string]: Entrypoint};
  asyncAssets: AsyncManifest;
}

// Supported algorithms listed in the spec: https://w3c.github.io/webappsec-subresource-integrity/#hash-functions
export const SRI_HASH_ALGORITHMS = ['sha256', 'sha384', 'sha512'];

export function calculateBase64IntegrityFromFilename(
  path: string,
  hashFunction: string,
  hashDigest: string,
): string | false {
  if (!isHashAlgorithmSupportedByBrowsers(hashFunction)) {
    return false;
  }
  if (hashDigest && hashDigest !== 'hex') {
    return false;
  }

  const chunkInfo =
    // Anything ending in a hyphen + hex string (e.g., `foo-00000000.js`).
    path.match(/.+?-(?:([a-f0-9]+))?\.[^.]+$/) ||
    // Unnamed dynamic imports like `00000000.js`.
    path.match(/^([a-f0-9]+)\.[^.]+$/);

  if (!chunkInfo || !chunkInfo[1]) {
    return false;
  }

  const hexHash = chunkInfo[1];
  const base64Hash = Buffer.from(hexHash, 'hex').toString('base64');
  return `${hashFunction}-${base64Hash}`;
}

function isHashAlgorithmSupportedByBrowsers(hashFunction: string) {
  return SRI_HASH_ALGORITHMS.includes(hashFunction);
}

export class AssetManifestPlugin implements Plugin {
  private readonly id: string;
  private readonly variant: AssetVariant;
  private readonly options: Required<Pick<Options, 'filename'>>;

  constructor({id, variant, filename = 'manifest.json'}: Options) {
    this.id = id;
    this.variant = variant;
    this.options = {
      filename,
    };
  }

  apply(compiler: Compiler) {
    compiler.hooks.afterEmit.tapAsync(
      'AssetManifestPlugin',
      async (compilation, callback) => {
        const manifest: AssetManifest = {
          id: this.id,
          variant: this.variant,
          version: '1.0',
          entrypoints: {},
          asyncAssets: getAsyncAssetManifest(compilation, {
            includeIntegrity: compiler.options.mode === 'production',
          }),
        };

        compilation.entrypoints.forEach((_, entryName: string) => {
          manifest.entrypoints[entryName] = getChunkDependencies(
            compilation,
            entryName,
          );
        });

        try {
          const file = join(
            compilation.outputOptions.path ?? '',
            this.options.filename,
          );
          await mkdirp(dirname(file));
          await writeFile(file, JSON.stringify(manifest, null, 2));
        } catch (err) {
          compilation.errors.push(err);
        } finally {
          callback();
        }
      },
    );
  }
}

function getAsyncAssetManifest(
  compilation: compilation.Compilation,
  {includeIntegrity = true} = {},
) {
  const {hashFunction, hashDigest, publicPath = ''} = compilation.outputOptions;
  const manifest: AsyncManifest = {};

  for (const chunkGroup of compilation.chunkGroups) {
    const files: AsyncManifestEntry[] = [];
    for (const chunk of chunkGroup.chunks) {
      for (const file of chunk.files) {
        if (!file.endsWith('.map')) {
          const integrity =
            includeIntegrity &&
            calculateBase64IntegrityFromFilename(
              file,
              hashFunction,
              hashDigest,
            );

          const fileIntegrity = integrity ? {integrity} : {};

          files.push({
            path: `${
              publicPath.endsWith('/') ? publicPath.slice(0, -1) : publicPath
            }/${file.startsWith('/') ? file.slice(1) : file}`,
            ...fileIntegrity,
          });
        }
      }
    }

    for (const block of chunkGroup.blocksIterable) {
      const dependency = block.module?.dependencies.find(
        (dep: {request: string}) => block.request === dep.request,
      );

      const id = dependency?.module.id;

      if (id != null) {
        manifest[id] = files;
      }
    }
  }

  return manifest;
}

export function getChunkDependencies(
  {entrypoints, outputOptions}: compilation.Compilation,
  entryName: string,
): Entrypoint {
  const {publicPath = '', hashFunction, hashDigest} = outputOptions;
  const dependencyChunks: string[] = entrypoints.get(entryName).chunks;
  const allChunkFiles = dependencyChunks.reduce(
    (allFiles: string[], depChunk: any) => [...allFiles, ...depChunk.files],
    [],
  );

  const dependencies: Entrypoint = {css: [], js: []};
  allChunkFiles.forEach((path) => {
    const extension = extname(path).replace('.', '') as keyof Entrypoint;
    if (!(extension in dependencies)) {
      return;
    }

    const integrity = calculateBase64IntegrityFromFilename(
      path,
      hashFunction,
      hashDigest,
    );

    dependencies[extension].push({
      path: `${publicPath}${path}`,
      ...(integrity ? {integrity} : {}),
    });
  });

  return dependencies;
}
