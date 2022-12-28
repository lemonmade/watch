import {createProject, quiltService} from '@quilted/craft';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default createProject((service) => {
  service.use(
    quiltService({
      entry: './stripe.ts',
      develop: false,
      polyfill: {features: ['fetch']},
    }),
    cloudflareWorkers({
      cache: false,
    }),
  );
});
