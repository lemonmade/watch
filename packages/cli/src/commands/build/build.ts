import {rollup} from 'rollup';
import brotliSizeModule from 'brotli-size';
import prettyBytes from 'pretty-bytes';

import type {Ui} from '../../ui';

import {loadLocalApp} from '../../utilities/app';
import {buildDetailsForExtension, ensureRootOutputDirectory} from '../../utilities/build';
import {createRollupConfiguration} from '../../utilities/rollup';

const BUNDLE_SIZE_GOOD = 10_000;
const BUNDLE_SIZE_OKAY = 40_000;

// The brotli-size package doesn’t have a proper ESM version, and at runtime
// ends up having an object with all its exports as the `default` export of
// the package.
const brotliSize = 'default' in brotliSizeModule ? (brotliSizeModule as unknown as {default: typeof brotliSizeModule}).default : brotliSizeModule;

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

  const builds = await Promise.all(
    app.extensions.map(async (extension) => {
      const bundle = await rollup(createRollupConfiguration(extension, {mode: 'production'}));
      const {directory, filename} = buildDetailsForExtension(extension, app);

      const {output: [{code}]} = await bundle.write({
        format: 'iife',
        dir: directory,
        entryFileNames: filename,
      });

      return {extension, size: code.length, minifiedSize: await brotliSize(code)};
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
      for (const {extension, size, minifiedSize} of builds) {
        const sizeContent = ui.Text(`(${prettyBytes(size)}, ${prettyBytes(minifiedSize)} minifed)`, {
          style: (content, style) => {
            if (minifiedSize <= BUNDLE_SIZE_GOOD) {
              return style.green(content);
            } else if (minifiedSize <= BUNDLE_SIZE_OKAY) {
              return style.yellow(content);
            } else {
              return style.red(content);
            }
          }
        });

        List.Item(`${extension.configuration.name} ${sizeContent}`);
      }
    });
  }
}
