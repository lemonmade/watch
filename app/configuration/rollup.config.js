import {quiltApp} from '@quilted/rollup/app';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

import {prismaFromEdge} from '../../configuration/rollup/prisma.js';

const configuration = await quiltApp({
  assets: {baseURL: '/assets/app/'},
  browser: {entry: './browser.tsx'},
  server: {
    entry: './server.tsx',
    runtime: cloudflareWorkers(),
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

configuration.at(-1).plugins.push(prismaFromEdge());

export default configuration;
