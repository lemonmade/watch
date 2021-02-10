import * as path from 'path';

import webpack from 'webpack';
import type {Configuration} from 'webpack';

import {loadApp} from './shared';
import type {Extension, App} from './shared';
import {createWebpackConfiguration as createBaseWebpackConfiguration} from './webpack-config';

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
  const baseConfig = createBaseWebpackConfiguration({mode: 'production'});

  return {
    ...baseConfig,
    entry: path.resolve(extension.root, 'index'),
    output: {
      ...baseConfig.output,
      filename: 'extension.js',
      path: path.resolve(app.root, 'build', extension.id),
    },
  };
}
