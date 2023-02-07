import {createProject, quiltService} from '@quilted/craft';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default createProject((project) => {
  project.use(
    quiltService({
      entry: './images.ts',
      format: 'custom',
      develop: false,
      polyfill: {
        features: ['fetch'],
      },
    }),
    cloudflareWorkers(),
  );
});
