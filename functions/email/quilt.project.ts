import {createProject, quiltService} from '@quilted/craft';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default createProject((project) => {
  project.use(
    quiltService({
      entry: './index.tsx',
      react: true,
      develop: false,
      httpHandler: false,
      polyfill: {
        features: ['fetch'],
      },
    }),
    cloudflareWorkers({
      cache: false,
    }),
  );
});
