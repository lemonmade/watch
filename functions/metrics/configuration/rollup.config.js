import {quiltServer} from '@quilted/rollup/server';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default quiltServer({
  entry: './metrics.ts',
  format: 'custom',
  runtime: cloudflareWorkers(),
});
