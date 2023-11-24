import {quiltServer} from '@quilted/rollup/server';

export default quiltServer({
  entry: './metrics.ts',
  format: 'custom',
});
