import {createApp, quiltApp, createProjectPlugin} from '@quilted/craft';
import type {App} from '@quilted/craft';
import type {} from '@quilted/craft/vite';

import {lambda} from '@quilted/aws/craft';

export default createApp((app) => {
  app.entry('./App');
  app.use(
    quiltApp({
      assets: {baseUrl: '/assets/app/'},
      develop: {port: 8912},
    }),
    createProjectPlugin({
      name: 'fix-rpc',
      build({configure}) {
        configure(({rollupOutputs}, options) => {
          if (!(options as any).quiltAppBrowser) return;

          rollupOutputs?.((outputs) => {
            return outputs.map(({manualChunks, ...output}) => {
              return {
                ...output,
                manualChunks(id, options) {
                  if (id.includes('node_modules/@remote-ui/')) {
                    return 'framework';
                  }

                  return typeof manualChunks === 'function'
                    ? manualChunks(id, options)
                    : manualChunks?.[id]?.[0];
                },
              };
            });
          });
        });
      },
    }),
    lambda(),
    createProjectPlugin<App>({
      name: 'Watch.RandomBits',
      develop({configure}) {
        configure(({viteConfig}) => {
          viteConfig?.((config) => {
            config.server ??= {};
            config.server.hmr ??= {};
            // I can't figure out how to make Caddy proxy wss correctly
            Object.assign(config.server.hmr, {
              protocol: 'ws',
              host: 'localhost',
            });
            return config;
          });
        });
      },
    }),
  );
});
