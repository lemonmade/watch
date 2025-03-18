import {quiltServer} from '@quilted/rollup/server';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

const configuration = await quiltServer({
  entry: './clips-upload.ts',
  format: 'custom',
  runtime: cloudflareWorkers(),
});

export default configuration;
