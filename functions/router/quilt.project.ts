import {createProject, quiltService} from '@quilted/craft';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default createProject((project) => {
  project.use(
    quiltService({
      entry: './router.ts',
      develop: false,
    }),
    cloudflareWorkers(),
  );
});
