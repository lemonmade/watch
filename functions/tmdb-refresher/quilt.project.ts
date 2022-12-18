import {createProject, quiltService} from '@quilted/craft';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default createProject((service) => {
  service.use(
    quiltService({
      entry: './tmdb-refresher.ts',
      httpHandler: false,
      develop: false,
      polyfill: {features: ['fetch', 'abort-controller']},
    }),
    cloudflareWorkers(),
  );
});
