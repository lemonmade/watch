import {quiltPackage} from '@quilted/rollup/package';

export default quiltPackage({
  executable: {
    watchapp: './source/cli.ts',
  },
});
