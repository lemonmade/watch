import {quiltModule} from '@quilted/rollup/module';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

import {prismaFromEdge} from '../../../tools/rollup/prisma.js';

const config = await quiltModule({
  entry: './stripe.ts',
  runtime: cloudflareWorkers(),
  assets: {
    minify: false,
  },
});

config.plugins.push(prismaFromEdge());

export default config;
