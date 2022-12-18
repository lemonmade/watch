import {createProject, quiltService} from '@quilted/craft';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default createProject((service) => {
  service.use(
    quiltService({
      entry: './tmdb-refresher-scheduler.ts',
      httpHandler: false,
      develop: false,
    }),
    cloudflareWorkers(),
  );
});
