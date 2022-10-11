import {createProject, quiltApp, createProjectPlugin} from '@quilted/craft';
import type {} from '@quilted/craft/vite';

import {prisma} from '../config/craft/plugins';

export default createProject((app) => {
  app.use(
    quiltApp({
      entry: './App.tsx',
      assets: {baseUrl: '/assets/app/'},
      develop: {port: 8912},
      server: {
        entry: './server.tsx',
        env: {
          inline: [
            'EMAIL_QUEUE_URL',
            'DATABASE_URL',
            'JWT_DEFAULT_SECRET',
            'TMDB_ACCESS_TOKEN',
            'GITHUB_CLIENT_ID',
            'GITHUB_CLIENT_SECRET',
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET',
          ],
        },
      },
    }),
    prisma(),
    createProjectPlugin({
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
