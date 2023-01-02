import {createProject, quiltService} from '@quilted/craft';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default createProject((project) => {
  project.use(
    quiltService({
      entry: './metrics.ts',
      format: 'custom',
      develop: false,
    }),
    cloudflareWorkers(),
  );
});
