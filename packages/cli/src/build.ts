/* eslint-disable @typescript-eslint/no-var-requires */

import * as path from 'path';

import webpack from 'webpack';
import type {Configuration} from 'webpack';

import {loadApp, toId} from './shared';
import type {Extension, App} from './shared';

export async function build() {
  const app = await loadApp();

  const build = webpack(
    app.extensions.map((extension) =>
      createWebpackConfiguration(extension, app),
    ),
  );

  await new Promise<void>((resolve, reject) => {
    build.run((error, stats) => {
      if (error) {
        reject(error);
        return;
      }

      if (stats?.hasErrors()) {
        reject(stats?.toString());
      }

      resolve();
    });
  });
}

function createWebpackConfiguration(
  extension: Extension,
  app: App,
): Configuration {
  const TerserWebpackPlugin = require('terser-webpack-plugin');

  return {
    mode: 'production',
    target: 'webworker',
    entry: path.resolve(extension.root, 'index'),
    output: {
      filename: 'extension.js',
      path: path.resolve(app.root, 'build', toId(extension)),
      globalObject: 'self',
    },
    resolve: {
      extensions: ['.esnext', '.mjs', '.ts', '.tsx', '.js', '.json'],
      mainFields: ['esnext', 'browser', 'module', 'main'],
      conditionNames: ['esnext', 'module', 'import', 'require'],
      alias: {
        react$: '@remote-ui/mini-react/compat',
        'react/jsx-runtime$': '@remote-ui/mini-react/jsx-runtime',
        'react-dom$': '@remote-ui/mini-react/compat',
        '@remote-ui/react$': '@remote-ui/mini-react/compat',
        '@remote-ui/react/jsx-runtime$': '@remote-ui/mini-react/jsx-runtime',
      },
    },
    module: {
      rules: [
        {
          test: /\.[jt]s(x?)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              configFile: false,
              sourceType: 'unambiguous',
              presets: [
                ['@babel/preset-env', {modules: false, useBuiltIns: false}],
                [
                  '@babel/preset-react',
                  {runtime: 'automatic', importSource: '@remote-ui/mini-react'},
                ],
                '@babel/preset-typescript',
              ],
            },
          },
        },
        {
          test: /\.esnext$/,
          include: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              configFile: false,
              sourceType: 'unambiguous',
              presets: [
                ['@babel/preset-env', {modules: false, useBuiltIns: false}],
              ],
            },
          },
        },
      ],
    },
    optimization: {
      concatenateModules: true,
      minimize: true,
      runtimeChunk: false,
      splitChunks: false,
      minimizer: [
        new TerserWebpackPlugin({
          extractComments: {
            condition: /^\**!|@preserve|@license|@cc_on/i,
            filename: () => `LICENSE.txt`,
            banner: (licenseFilename: string) => `Licenses: ${licenseFilename}`,
          },
          terserOptions: {
            ecma: 5,
            warnings: false,
            // Per one of the authors of Preact, the extra pass may inline more esmodule imports
            // @see https://github.com/webpack-contrib/mini-css-extract-plugin/pull/509#issuecomment-599083073
            compress: {
              passes: 2,
            },
            ie8: false,
            safari10: true,
            mangle: {
              safari10: true,
            },
          },
        }),
      ],
    },
  };
}
