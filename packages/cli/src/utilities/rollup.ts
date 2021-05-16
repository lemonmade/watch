import * as path from 'path';

import type {RollupOptions, Plugin} from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import esbuild from 'rollup-plugin-esbuild';

import type {LocalExtension} from './app';

export function createRollupConfiguration(
  extension: LocalExtension,
): RollupOptions {
  return {
    input: path.join(extension.root, 'index'),
    plugins: [
      nodeResolve({
        exportConditions: ['esnext', 'import', 'require', 'default'],
        extensions: ['.tsx', '.ts', '.esnext', '.mjs', '.js', '.json'],
        preferBuiltins: true,
      }),
      commonjs(),
      esbuild({
        include: /\.esnext$/,
        exclude: [],
        minify: false,
        loaders: {'.esnext': 'js'},
      }),
      esbuildWithJSXRuntime(),
      alias({
        entries: {
          'react/jsx-runtime': '@remote-ui/mini-react/jsx-runtime',
          react: '@remote-ui/mini-react/compat',
          'react-dom': '@remote-ui/mini-react/compat',
          '@remote-ui/react/jsx-runtime': '@remote-ui/mini-react/jsx-runtime',
          '@remote-ui/react': '@remote-ui/mini-react/compat',
        },
      }),
    ],
  };
}

function esbuildWithJSXRuntime(): Plugin {
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
                importSource: '@remote-ui/mini-react',
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
