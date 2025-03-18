import {quiltModule} from '@quilted/rollup/module';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';
import {prismaFromEdge} from '../../tools/rollup/prisma.js';

const config = await quiltModule({
  entry: './tmdb-refresher.ts',
  runtime: cloudflareWorkers(),
});

config.plugins.push(prismaFromEdge());

export default config;
