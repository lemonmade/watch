import * as path from 'path';

import webpack from 'webpack';
import type {Configuration} from 'webpack';

import type {Ui} from './ui';

import {buildDetailsForExtension} from './utilities';
import {loadLocalApp} from './app';
import type {LocalExtension, LocalApp} from './app';
import {createWebpackConfiguration as createBaseWebpackConfiguration} from './webpack-config';

export async function build({ui}: {ui: Ui}) {
  const app = await loadLocalApp();

  if (app.extensions.length === 0) {
    ui.Heading('heads up!', {style: (content, style) => style.yellow(content)});
    ui.TextBlock(
      `Your app doesn’t have any extensions to build yet. Run ${ui.Code(
        'watchapp create extension',
      )} to get started!`,
    );

    process.exitCode = 1;
    return;
  }

  const hasOneExtension = app.extensions.length === 1;

  ui.TextBlock(
    `We’re building the latest changes for your ${
      hasOneExtension
        ? `${ui.Code(app.extensions[0].configuration.name)} extension`
        : `${app.extensions.length} extensions`
    }...`,
  );

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

  ui.Heading('success!', {style: (content, style) => style.green(content)});

  if (app.extensions.length === 1) {
    ui.TextBlock(
      `Built extension ${ui.Code(app.extensions[0].configuration.name)}!`,
    );
  } else {
    ui.TextBlock(`Built ${app.extensions.length} extensions:`);
    ui.List((List) => {
      for (const extension of app.extensions) {
        List.Item(extension.configuration.name);
      }
    });
  }
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
