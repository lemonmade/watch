import {quiltApp} from '@quilted/rollup/app';

const configuration = await quiltApp({
  assets: {baseURL: '/assets/app/'},
  browser: {entry: './browser.tsx'},
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
});

export default configuration;
