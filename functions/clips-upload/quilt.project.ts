import {createProject, quiltService} from '@quilted/craft';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default createProject((project) => {
  project.use(
    quiltService({
      entry: './clips-upload.ts',
      develop: false,
    }),
    cloudflareWorkers({
      cache: false,
    }),
  );
});
