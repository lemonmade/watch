import {createProjectPlugin} from '@quilted/sewing-kit';
import type {} from '@quilted/sewing-kit-rollup';

export const dotenv = () =>
  createProjectPlugin({
    name: 'Watch.DotEnv',
    develop({configure}) {
      configure(({rollupPlugins}) => {
        rollupPlugins?.((plugins) => {
          plugins.push({
            name: 'watch/dotenv',
            transform(code, id) {
              if (!this.getModuleInfo(id)?.isEntry) return null;
              return `import 'dotenv/config';\n${code}`;
            },
          });

          return plugins;
        });
      });
    },
  });
