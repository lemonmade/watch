import {createProject, quiltService} from '@quilted/craft';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default createProject((project) => {
  project.use(
    quiltService({
      entry: './index.tsx',
      format: 'custom',
      react: true,
      develop: false,
      polyfill: {
        features: ['fetch'],
      },
    }),
    cloudflareWorkers(),
  );
});
