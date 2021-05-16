import {rollup} from 'rollup';

import type {Ui} from '../../ui';

import {loadLocalApp} from '../../utilities/app';
import {buildDetailsForExtension, ensureRootOutputDirectory} from '../../utilities/build';
import {createRollupConfiguration} from '../../utilities/rollup';

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

  await ensureRootOutputDirectory(app);

  await Promise.all(
    app.extensions.map(async (extension) => {
      const bundle = await rollup(createRollupConfiguration(extension, {mode: 'production'}));
      const {directory, filename} = buildDetailsForExtension(extension, app);

      await bundle.write({
        format: 'iife',
        dir: directory,
        entryFileNames: filename,
      });
    }),
  );

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
