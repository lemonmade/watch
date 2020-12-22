import {createServer} from 'http';

import {join, dirname, extname} from 'path';
import {createWebApp} from '@sewing-kit/config';
import {
  Task,
  Runtime,
  WebApp,
  Target,
  TargetBuilder,
  TargetRuntime,
  createProjectPlugin,
  createProjectBuildPlugin,
} from '@sewing-kit/plugins';
import type {
  BuildWebAppConfigurationHooks,
  DevWebAppConfigurationHooks,
  BuildWebAppTargetOptions,
} from '@sewing-kit/hooks';
import {quiltWebApp} from '@quilted/sewing-kit-plugins';
import type {} from '@sewing-kit/plugin-webpack';

import {mkdirp, writeFile} from 'fs-extra';
import type {Compiler, Plugin, compilation} from 'webpack';

import {CDN_DOMAIN, CDN_PREFIX} from '../config/deploy/constants';

export default createWebApp((app) => {
  app.entry('./index');
  app.use(
    quiltWebApp({
      preact: true,
    }),
    brotli(),
    webAppMagicAliases(),
    webAppAutoBrowserEntry({
      hydrate: (task) => task === Task.Build,
      include: (target) => !target.options.quiltAutoServer,
    }),
    webAppAutoServer(),
    randomBits(),
  );
});

function randomBits() {
  return createProjectPlugin<WebApp>(
    'Watch.App.Etcetera',
    ({api, tasks: {build, dev}}) => {
      dev.hook(({hooks}) => {
        hooks.configure.hook((configuration) => {
          configuration.assetServerPort?.hook(() => 3002);

          configuration.webpackPublicPath?.hook(
            () => `http://localhost:3002/assets/`,
          );
        });

        hooks.steps.hook((steps) => [
          ...steps,
          api.createStep(
            {
              label: 'starting stating HTML development server',
              id: 'StaticHtml.DevServer',
            },
            async (step) => {
              step.indefinite(async ({stdio}) => {
                createServer((req, res) => {
                  stdio.stdout.write(`request for path: ${req.url}\n`);

                  res.writeHead(200, {
                    'Content-Type': 'text/html',
                    // 'Content-Security-Policy':
                    //   "default-src http://* https://* 'unsafe-eval'",
                  });

                  res.write(
                    `<html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0, height=device-height, user-scalable=0">
                        </head>
                        <body>
                          <div id="app"></div>
                          <script src="http://localhost:3002/assets/main.js"></script>
                        </body>
                      </html>`,
                  );
                  res.end();
                }).listen(8082, () => {
                  step.log(`App server listening on localhost:8082`);
                });
              });
            },
          ),
        ]);
      });

      build.hook(({hooks}) => {
        hooks.target.hook(({target, hooks}) => {
          hooks.configure.hook((configuration) => {
            configuration.webpackPublicPath?.hook(
              () => `https://${CDN_DOMAIN}/${CDN_PREFIX}/`,
            );

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
                      }),
                    ];
              });
            }
          });
        });
      });
    },
  );
}

function brotli() {
  return createProjectBuildPlugin('Brotli', ({hooks}) => {
    hooks.target.hook(({target, hooks}) => {
      if (
        !target.runtime.includes(Runtime.Browser) &&
        !target.runtime.includes(Runtime.WebWorker)
      ) {
        return;
      }

      hooks.configure.hook((configuration) => {
        configuration.webpackPlugins?.hook((plugins) => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const CompressionPlugin = require('compression-webpack-plugin');

          return [
            ...plugins,
            new CompressionPlugin({
              filename: '[path].br',
              algorithm: 'brotliCompress',
              minRatio: 1,
              test: /\.(js|css)$/,
            }),
          ];
        });
      });
    });
  });
}

declare module '@sewing-kit/hooks' {
  interface BuildWebAppTargetOptions {
    readonly quiltAutoServer?: true;
  }
}

const MAGIC_PATH_APP_COMPONENT = '__quilt__/App';

interface MagicAliasesOptions {
  readonly build?: boolean;
  readonly dev?: boolean;
  include?(target: Target<WebApp, BuildWebAppTargetOptions>): boolean;
}

function webAppMagicAliases({
  build = true,
  dev = true,
  include = () => true,
}: MagicAliasesOptions = {}) {
  return createProjectPlugin<WebApp>(
    'Quilt.WebAppMagicAliases',
    ({api, project, tasks}) => {
      const appEntry = project.fs.resolvePath(project.entry ?? 'index');
      const appComponentModulePath = api.tmpPath(
        `quilt/${project.name}-app-component.js`,
      );

      function addMagicAliases({
        webpackAliases,
        webpackPlugins,
      }: BuildWebAppConfigurationHooks | DevWebAppConfigurationHooks) {
        webpackAliases?.hook((aliases) => ({
          ...aliases,
          [MAGIC_PATH_APP_COMPONENT]: appComponentModulePath,
        }));

        webpackPlugins?.hook(async (plugins) => {
          const {default: WebpackVirtualModules} = await import(
            'webpack-virtual-modules'
          );
          return [
            ...plugins,
            new WebpackVirtualModules({
              [appComponentModulePath]: `
                import * as AppModule from ${JSON.stringify(appEntry)};

                var App = getAppComponent();
                export default App;

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
              `,
            }),
          ];
        });
      }

      if (build) {
        tasks.build.hook(({hooks}) => {
          hooks.target.hook(({target, hooks}) => {
            if (!include(target)) return;
            hooks.configure.hook(addMagicAliases);
          });
        });
      }

      if (dev) {
        tasks.dev.hook(({hooks}) => {
          hooks.configure.hook(addMagicAliases);
        });
      }
    },
  );
}

interface BrowserEntryOptions {
  readonly hydrate?: boolean | ((task: Task) => boolean);
  readonly build?: boolean;
  readonly dev?: boolean;
  include?(target: Target<WebApp, BuildWebAppTargetOptions>): boolean;
}

function webAppAutoBrowserEntry({
  hydrate = true,
  build = true,
  dev = true,
  include = () => true,
}: BrowserEntryOptions = {}) {
  return createProjectPlugin<WebApp>(
    'Quilt.WebAppAutoBrowserEntry',
    ({project, api, tasks}) => {
      function addConfiguration(task: Task) {
        return ({
          webpackEntries,
          webpackPlugins,
        }: BuildWebAppConfigurationHooks | DevWebAppConfigurationHooks) => {
          const entry = api.tmpPath(`quilt/${project.name}-client.js`);
          const shouldHydrate =
            typeof hydrate === 'boolean' ? hydrate : hydrate(task);
          const reactFunction = shouldHydrate ? 'hydrate' : 'render';

          webpackEntries?.hook(() => [entry]);

          webpackPlugins?.hook(async (plugins) => {
            const {default: WebpackVirtualModules} = await import(
              'webpack-virtual-modules'
            );
            return [
              ...plugins,
              new WebpackVirtualModules({
                [entry]: `
                  import React from 'react';
                  import {${reactFunction}} from 'react-dom';
                  import App from ${JSON.stringify(MAGIC_PATH_APP_COMPONENT)};

                  ${reactFunction}(<App />, document.getElementById('app'));
                `,
              }),
            ];
          });
        };
      }

      if (build) {
        tasks.build.hook(({hooks}) => {
          hooks.target.hook(({target, hooks}) => {
            if (!include(target)) return;
            hooks.configure.hook(addConfiguration(Task.Build));
          });
        });
      }

      if (dev) {
        // eslint-disable-next-line no-warning-comments
        // TODO: dev needs targets too!
        tasks.dev.hook(({hooks}) => {
          hooks.configure.hook(addConfiguration(Task.Dev));
        });
      }
    },
  );
}

function webAppAutoServer() {
  return createProjectBuildPlugin<WebApp>(
    'Quilt.WebAppAutoServer',
    ({project, hooks, api}) => {
      hooks.targets.hook((targets) => [
        ...targets,
        new TargetBuilder({
          project,
          options: [{quiltAutoServer: true}],
          runtime: new TargetRuntime([Runtime.Node]),
          needs: targets.filter((target) => target.default),
        }),
      ]);

      hooks.target.hook(({target, hooks, context}) => {
        if (!target.options.quiltAutoServer) return;

        hooks.configure.hook((configuration) => {
          const polyfills = api.tmpPath(`quilt/${project.name}-polyfills.js`);
          const entry = api.tmpPath(`quilt/${project.name}.js`);

          configuration.webpackOutputFilename?.hook(() => 'index.js');

          configuration.webpackEntries?.hook(() => [entry]);

          configuration.webpackPlugins?.hook(async (plugins) => {
            const {default: WebpackVirtualModules} = await import(
              'webpack-virtual-modules'
            );

            const [stats] = [...context.project.webpackStats!.values()];
            const entrypoints = entrypointFromCompilation(stats.compilation);

            return [
              ...plugins,
              new WebpackVirtualModules({
                [polyfills]: `
                    import fetch from 'node-fetch';
                    import {URL} from 'url';
  
                    if (!global.fetch) {
                      global.fetch = fetch;
                      global.Response = fetch.Response;
                      global.Headers = fetch.Headers;
                      global.Request = fetch.Request;
                    }

                    if (!global.URL) {
                      global.URL = URL;
                    }
                  `,
                [entry]: `
                    import ${JSON.stringify(polyfills)};
                    import App from ${JSON.stringify(MAGIC_PATH_APP_COMPONENT)};

                    import React from 'react';
                    import {renderToStaticMarkup} from 'react-dom/server';
                    import Koa from 'koa';
                    import mount from 'koa-mount';
                    import serve from 'koa-static';
                    import {render, Html} from '@quilted/quilt/server';

                    process.on('uncaughtException', (...args) => {
                      console.error(...args);
                    });

                    export async function handler(event) {
                      const {html, http, markup, asyncAssets} = await render(<App />, {
                        url: new URL(event.rawPath, 'https://' + event.requestContext.domainName)
                      });

                      const {headers, statusCode = 200} = http.state;

                      console.log(event);

                      return {
                        statusCode,
                        body: \`<!DOCTYPE html>\${renderToStaticMarkup(
                          <Html
                            manager={html}
                            styles={${JSON.stringify(entrypoints.main.css)}}
                            scripts={${JSON.stringify(entrypoints.main.js)}}
                            preloadAssets={[]}
                          >
                            {markup}
                          </Html>
                        )}\`,
                        headers: [...headers].reduce((allHeaders, [key, value]) => {
                          allHeaders[key] = value;
                          return allHeaders;
                        }, {}),
                      };
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

function entrypointFromCompilation(compilation: compilation.Compilation) {
  return [...compilation.entrypoints.keys()].reduce<{
    [key: string]: Entrypoint;
  }>(
    (entries, name) => ({
      ...entries,
      [name]: getChunkDependencies(compilation, name),
    }),
    {},
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
