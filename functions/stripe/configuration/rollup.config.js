import {quiltModule} from '@quilted/rollup/module';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';
import {prismaFromEdge} from '../../../configuration/rollup/prisma.js';

const config = await quiltModule({
  entry: './stripe.ts',
  runtime: cloudflareWorkers(),
});

config.plugins.push(prismaFromEdge());

export default config;
