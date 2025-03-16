import {quiltServer} from '@quilted/rollup/server';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default quiltServer({
  entry: './index.tsx',
  format: 'custom',
  runtime: cloudflareWorkers(),
});
