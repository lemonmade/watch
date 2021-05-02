import {Service, createProjectBuildPlugin} from '@sewing-kit/plugins';
import {stripIndent} from 'common-tags';

const PLUGIN = 'LambdaBuild';

export function lambdaBuild({react = false} = {}) {
  return createProjectBuildPlugin<Service>(
    PLUGIN,
    ({api, project, workspace, hooks}) => {
      hooks.steps.hook((steps) => [
        ...steps,
        api.createStep(
          {
            id: PLUGIN,
            label: `Build lambda output for ${project.name}`,
          },
          async () => {
            const [
              {rollup},
              {default: json},
              {default: alias},
              {default: commonjs},
              {default: nodeResolve},
              {default: esbuild},
            ] = await Promise.all([
              import('rollup'),
              import('@rollup/plugin-json'),
              import('@rollup/plugin-alias'),
              import('@rollup/plugin-commonjs'),
              import('@rollup/plugin-node-resolve'),
              import('rollup-plugin-esbuild'),
            ]);

            const entry = project.fs.resolvePath(project.entry!);
            const magicEntry = 'lambda-build/entry.js';

            const bundle = await rollup({
              input: magicEntry,
              plugins: [
                json(),
                {
                  name: 'lambda-build/magic-entry',
                  resolveId(id) {
                    if (id === magicEntry) return id;
                  },
                  load(id) {
                    if (id === magicEntry) {
                      return stripIndent`
                        ${
                          react
                            ? 'import React from "react"; global.React = React;'
                            : ''
                        }
                        export {default as handler} from ${JSON.stringify(
                          entry,
                        )};
                      `;
                    }
                  },
                },
                alias({
                  entries: {
                    global: workspace.fs.resolvePath('global'),
                    shared: workspace.fs.resolvePath('functions/shared'),
                  },
                }),
                nodeResolve({
                  exportConditions: ['esnext', 'import', 'require', 'default'],
                  extensions: [
                    '.tsx',
                    '.ts',
                    '.esnext',
                    '.mjs',
                    '.js',
                    '.json',
                  ],
                  preferBuiltins: true,
                }),
                commonjs(),
                esbuild({
                  target: 'node14',
                  loaders: {
                    '.esnext': 'js',
                  },
                }),
              ],
              external: ['aws-sdk', '@prisma/client'],
            });

            await bundle.write({
              dir:
                workspace.services.length > 1
                  ? workspace.fs.buildPath('services', project.name)
                  : workspace.fs.buildPath('service'),
              format: 'commonjs',
              entryFileNames: 'index.js',
            });
          },
        ),
      ]);
    },
  );
}
