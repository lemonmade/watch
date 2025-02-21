import {defineConfig} from 'vite';
import {quiltApp} from '@quilted/vite/app';

export default defineConfig({
  // I can't figure out how to make Caddy proxy wss correctly
  // Is this still needed?
  server: {
    port: 8912,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
    allowedHosts: ['watch.lemon.dev'],
  },
  plugins: [
    quiltApp({
      browser: {
        entry: './browser.tsx',
      },
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
  ],
});
