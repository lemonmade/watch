/* eslint-disable @typescript-eslint/no-var-requires */

import type {Configuration} from 'webpack';

export function createWebpackConfiguration({
  mode,
}: {
  mode: NonNullable<Configuration['mode']>;
}): Configuration {
  const TerserWebpackPlugin = require('terser-webpack-plugin');

  return {
    mode,
    target: 'webworker',
    output: {
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
      minimizer:
        mode === 'development'
          ? []
          : [
              new TerserWebpackPlugin({
                extractComments: {
                  condition: /^\**!|@preserve|@license|@cc_on/i,
                  filename: () => `LICENSE.txt`,
                  banner: (licenseFilename: string) =>
                    `Licenses: ${licenseFilename}`,
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
