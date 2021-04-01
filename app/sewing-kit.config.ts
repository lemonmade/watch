import {createWebApp} from '@sewing-kit/config';
import {
  Runtime,
  WebApp,
  createProjectPlugin,
  createProjectBuildPlugin,
} from '@sewing-kit/plugins';
import {
  quiltWebApp,
  MAGIC_MODULE_APP_COMPONENT,
  MAGIC_MODULE_APP_AUTO_SERVER_ASSETS,
} from '@quilted/sewing-kit-plugins';
import {aws} from '@quilted/aws/sewing-kit';
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
      autoServer: {port: 3003},
      assetServer: {port: 3002},
      cdn: CDN_ROOT,
      features: ['base', 'fetch'],
      browserGroups: ['evergreen', 'latest-chrome'],
    }),
    aws(),
    randomBits(),
    bundleAnalyzer(),
  );
});

function randomBits() {
  return createProjectPlugin<WebApp>('Watch.App.Etcetera', ({tasks}) => {
    tasks.dev.hook(({hooks}) => {
      hooks.configure.hook((configuration) => {
        // Shouldn't need this...
        configuration.webpackPublicPath?.hook(
          () => `http://localhost:3002/assets/`,
        );
      });
    });

    tasks.build.hook(({hooks}) => {
      hooks.target.hook(({hooks}) => {
        hooks.configure.hook((configuration) => {
          configuration.quiltAutoServerContent?.hook(
            () => `
              import App from ${JSON.stringify(MAGIC_MODULE_APP_COMPONENT)};
              import assets from ${JSON.stringify(
                MAGIC_MODULE_APP_AUTO_SERVER_ASSETS,
              )};

              import {createApp, html} from '@lemon/tiny-server';
              import {createLambdaApiGatewayProxy} from '@lemon/tiny-server-aws';
              import {render, runApp, Html} from '@quilted/quilt/server';

              const app = createApp();

              app.get(async (request) => {
                console.log(request);

                const runContext = await runApp(<App />, {
                  url: request.url,
                });

                const {headers, statusCode = 200} = runContext.http.state;

                const usedAssets = runContext.asyncAssets.used({timing: 'immediate'});

                const assetOptions = {userAgent: request.headers.get('User-Agent')};
              
                const [styles, scripts, preload] = await Promise.all([
                  assets.styles({async: usedAssets, options: assetOptions}),
                  assets.scripts({async: usedAssets, options: assetOptions}),
                  assets.asyncAssets(runContext.asyncAssets.used({timing: 'soon'}), {
                    options: assetOptions,
                  }),
                ]);

                return html(
                  render(
                    <Html manager={runContext.html} styles={styles} scripts={scripts} preloadAssets={preload}>
                      {runContext.markup}
                    </Html>,
                  ), {
                    headers,
                    status: statusCode,
                  }
                );
              });

              export const handler = createLambdaApiGatewayProxy(app);
            `,
          );
        });
      });
    });
  });
}

function bundleAnalyzer() {
  return createProjectBuildPlugin('Watch.BundleAnalyzer', ({hooks}) => {
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
