import * as path from 'path';

import webpack from 'webpack';
import type {Configuration} from 'webpack';

import {buildDetailsForExtension} from './utilities';
import {loadLocalApp} from './app';
import type {LocalExtension, LocalApp} from './app';
import {createWebpackConfiguration as createBaseWebpackConfiguration} from './webpack-config';

export async function build() {
  const app = await loadLocalApp();

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
  extension: LocalExtension,
  app: LocalApp,
): Configuration {
  const baseConfig = createBaseWebpackConfiguration({mode: 'production'});
  const {filename, directory} = buildDetailsForExtension(extension, app);

  return {
    ...baseConfig,
    entry: path.resolve(extension.root, 'index'),
    output: {
      ...baseConfig.output,
      filename,
      path: directory,
    },
  };
}
