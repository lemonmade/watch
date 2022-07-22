import {createProject, quiltPackage} from '@quilted/craft';

export default createProject((pkg) => {
  pkg.use(
    quiltPackage({
      graphql: true,
      binaries: {
        watchapp: './source/cli.ts',
      },
    }),
  );
});
