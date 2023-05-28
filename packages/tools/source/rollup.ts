import * as path from 'path';
import {fileURLToPath} from 'url';

import type {
  Plugin,
  RollupOptions,
  RollupOptionsFunction,
  InputPluginOption,
} from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import esbuild, {type Options as ESBuildOptions} from 'rollup-plugin-esbuild';

const MAGIC_MODULE_EXTENSION_ENTRY = '__MAGIC__/ClipsExtension.js';

export function extensionRollupConfiguration(
  configurationFile: string,
  baseConfigurationOrFunction?: RollupOptions | RollupOptionsFunction,
  {
    esbuild: esbuildOptions = true,
    mode: explicitMode,
  }: {
    esbuild?: boolean | ESBuildOptions;
    mode?: 'production' | 'development';
  } = {},
): RollupOptionsFunction {
  return async function rollupConfiguration(args) {
    const mode = explicitMode || process.env.MODE || 'production';

    let root: string;

    // let consumers pass either a regular path, or a file URL, which
    // they can conveniently get from `import.meta.url`.
    try {
      root = fileURLToPath(new URL('.', configurationFile));
    } catch {
      root = path.dirname(configurationFile);
    }

    let baseConfiguration =
      typeof baseConfigurationOrFunction === 'function'
        ? await baseConfigurationOrFunction(args)
        : baseConfigurationOrFunction;

    if (Array.isArray(baseConfiguration)) {
      baseConfiguration = baseConfiguration[0]!;
    }

    let input = baseConfiguration?.input;

    const plugins: InputPluginOption[] = [
      replace({
        values: {'process.env.NODE_ENV': JSON.stringify(mode)},
        preventAssignment: true,
      }),
    ];

    if (input == null) {
      input = MAGIC_MODULE_EXTENSION_ENTRY;
      plugins.push({
        name: '@quilted/magic-module/extension-entry',
        async resolveId(id) {
          if (id === MAGIC_MODULE_EXTENSION_ENTRY) return id;
          return null;
        },
        async load(source) {
          if (source !== MAGIC_MODULE_EXTENSION_ENTRY) return null;

          const {loadLocalExtension} = await import('./app.ts');

          const extension = await loadLocalExtension(root);

          this.addWatchFile(extension.configurationFile.path);

          return `
            ${extension.extends
              .map((extensionPoint, index) => {
                return `import extension${index} from ${JSON.stringify(
                  path.resolve(extension.root, extensionPoint.module),
                )}`;
              })
              .join('\n')}

              ${extension.extends
                .map((extensionPoint, index) => {
                  return `clips.register(${JSON.stringify(
                    extensionPoint.target,
                  )}, extension${index});`;
                })
                .join('\n')}
          `;
        },
      });
    }

    plugins.push(
      nodeResolve({
        exportConditions: [
          'quilt:esnext',
          'esnext',
          'import',
          'require',
          'default',
        ],
        extensions: ['.tsx', '.ts', '.esnext', '.mjs', '.js', '.json'],
        preferBuiltins: true,
      }),
      commonjs(),
      esbuild({
        include: /\.esnext$/,
        exclude: [],
        minify: false,
        target: 'es2019',
        loaders: {'.esnext': 'js'},
      }),
    );

    if (esbuildOptions) {
      plugins.push(
        esbuild({
          minify: false,
          target: 'es2019',
          jsx: 'automatic',
          ...(typeof esbuildOptions === 'boolean' ? {} : esbuildOptions),
        }),
      );
    }

    const basePlugins = (await baseConfiguration?.plugins) || [];
    plugins.push(...(Array.isArray(basePlugins) ? basePlugins : [basePlugins]));

    if (mode === 'production') {
      plugins.push(minifyChunkWithESBuild());
    }

    return {
      input,
      plugins,
    };
  };
}

// @see https://github.com/egoist/rollup-plugin-esbuild/blob/master/src/index.ts#L170-L195
function minifyChunkWithESBuild(): Plugin {
  return {
    name: '@watching/esbuild-minify',
    async renderChunk(code) {
      const {transform, formatMessages} = await import('esbuild');

      const result = await transform(code, {
        loader: 'js',
        minify: true,
        // target: '',
      });

      if (result.warnings.length > 0) {
        const warnings = await formatMessages(result.warnings, {
          kind: 'warning',
          color: true,
        });

        for (const warning of warnings) {
          this.warn(warning);
        }
      }

      return result.code
        ? {
            code: result.code,
            map: result.map || null,
          }
        : null;
    },
  };
}
