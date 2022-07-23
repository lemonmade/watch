import * as path from 'path';

import type {RollupOptions, Plugin} from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import esbuild from 'rollup-plugin-esbuild';

import type {LocalExtension} from './app';

const MAGIC_MODULE_EXTENSION_ENTRY = '__MAGIC__/ClipsExtension.tsx';

export async function createRollupConfiguration(
  extension: LocalExtension,
  {mode = 'production'}: {mode?: 'development' | 'production'} = {},
): Promise<RollupOptions> {
  return {
    input: MAGIC_MODULE_EXTENSION_ENTRY,
    plugins: [
      {
        name: '@quilted/magic-module/extension-entry',
        async resolveId(id) {
          if (id === MAGIC_MODULE_EXTENSION_ENTRY) return id;
          return null;
        },
        async load(source) {
          if (source !== MAGIC_MODULE_EXTENSION_ENTRY) return null;

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
      },
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
        target: 'es2017',
        loaders: {'.esnext': 'js'},
        define: {'process.env.NODE_ENV': JSON.stringify(mode)},
      }),
      esbuildWithJSXRuntime({
        define: {'process.env.NODE_ENV': JSON.stringify(mode)},
      }),
      ...(mode === 'production' ? [minifyChunkWithESBuild()] : []),
    ],
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

function esbuildWithJSXRuntime(
  options: import('esbuild').TransformOptions = {},
): Plugin {
  return {
    name: '@watching/esbuild-with-jsx-runtime',
    async transform(code, id) {
      const loader = esbuildLoader(id);

      const [
        {transformAsync: transformWithBabel},
        {transform: transformWithESBuild},
      ] = await Promise.all([import('@babel/core'), import('esbuild')]);

      const {code: intermediateCode} =
        (await transformWithBabel(code, {
          filename: id,
          configFile: false,
          sourceType: 'module',
          presets: [
            [
              '@babel/preset-react',
              {
                development: false,
                runtime: 'automatic',
              },
            ],
          ],
          plugins:
            loader === 'ts'
              ? [['@babel/plugin-syntax-typescript', {isTSX: true}]]
              : undefined,
        })) ?? {};

      if (intermediateCode == null) {
        return {code: intermediateCode ?? undefined};
      }

      const {code: finalCode, map} = await transformWithESBuild(
        intermediateCode,
        {
          ...options,
          target: 'es2017',
          loader,
          minify: false,
        },
      );

      return {code: finalCode || undefined, map: map || null};
    },
  };
}

const ESBUILD_MATCH = /\.(ts|js)x?$/;
function esbuildLoader(id: string) {
  return id.match(ESBUILD_MATCH)?.[1] as 'js' | 'ts' | undefined;
}
