import {createWebApp} from '@sewing-kit/config';
import {
  Runtime,
  WebApp,
  createProjectPlugin,
  createProjectBuildPlugin,
} from '@sewing-kit/plugins';
import {quiltWebApp} from '@quilted/sewing-kit-plugins';
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
      preact: true,
      autoServer: {port: 3003},
      assetServer: {port: 3002},
      cdn: CDN_ROOT,
      features: ['base', 'fetch'],
      browserGroups: ['evergreen', 'latest-chrome'],
    }),
    aws(),
    brotli(),
    randomBits(),
    bundleAnalyzer(),
  );
});

function randomBits() {
  return createProjectPlugin<WebApp>('Watch.App.Etcetera', ({tasks: {dev}}) => {
    dev.hook(({hooks}) => {
      hooks.configure.hook((configuration) => {
        // Shouldn't need this...
        configuration.webpackPublicPath?.hook(
          () => `http://localhost:3002/assets/`,
        );
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
