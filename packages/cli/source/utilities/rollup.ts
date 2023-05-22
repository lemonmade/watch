import * as path from 'path';

import {loadConfigFile} from 'rollup/loadConfigFile';
import type {RollupOptions} from 'rollup';
import type {LocalExtension} from './app';

export async function createRollupConfiguration(
  extension: LocalExtension,
  {mode = 'production'}: {mode?: 'development' | 'production'} = {},
): Promise<RollupOptions> {
  let rollupOptions: RollupOptions | undefined;

  const rollupCommandOptions = {
    environment: `MODE:${mode}`,
  };

  try {
    const loadedConfigurations = await loadConfigFile(
      path.resolve(extension.root, 'rollup.config.js'),
      rollupCommandOptions,
    );

    rollupOptions = loadedConfigurations.options[0]!;
  } catch {
    // noop
  }

  if (rollupOptions == null) {
    const {extensionRollupConfiguration} = await import(
      '@watching/tools/rollup'
    );

    const automaticConfiguration = await extensionRollupConfiguration(
      extension.configurationFile.path,
      {mode},
    )(rollupCommandOptions);

    rollupOptions = Array.isArray(automaticConfiguration)
      ? automaticConfiguration[0]!
      : automaticConfiguration;
  }

  return rollupOptions;
}
