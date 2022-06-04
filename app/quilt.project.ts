import {createApp, quiltApp, createProjectPlugin} from '@quilted/craft';
import type {App} from '@quilted/craft';
import type {} from '@quilted/craft/vite';

export default createApp((app) => {
  app.entry('./App');
  app.use(
    quiltApp({
      assets: {baseUrl: '/assets/app/'},
      develop: {port: 8912},
    }),
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
