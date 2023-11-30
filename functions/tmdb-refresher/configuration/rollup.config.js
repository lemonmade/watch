import {quiltServer} from '@quilted/rollup/server';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default quiltServer({
  entry: './tmdb-refresher.ts',
  format: 'custom',
  runtime: cloudflareWorkers(),
});
