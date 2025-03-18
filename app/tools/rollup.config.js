import {quiltApp} from '@quilted/rollup/app';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

import {prismaFromEdge} from '../../tools/rollup/prisma.js';

const configuration = await quiltApp({
  assets: {baseURL: '/assets/app/'},
  browser: {entry: './browser.tsx'},
  server: {
    entry: './server.tsx',
    runtime: cloudflareWorkers(),
    format:
      process.env.NODE_ENV === 'development' ? 'request-router' : 'custom',
  },
});

configuration.at(-1).plugins.push(prismaFromEdge());

export default configuration;
