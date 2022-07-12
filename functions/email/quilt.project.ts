import {createProject, quiltService} from '@quilted/craft';

export default createProject((project) => {
  project.use(
    quiltService({
      entry: './index.tsx',
      react: true,
      develop: false,
      polyfill: {
        features: ['fetch'],
      },
    }),
  );
});
