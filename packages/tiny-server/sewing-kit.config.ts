import {createPackage, Runtime} from '@sewing-kit/config';
import {quiltPackage} from '@quilted/sewing-kit-plugins';

export default createPackage((pkg) => {
  pkg.entry({root: './src/index'});
  pkg.runtime(Runtime.Node);
  pkg.use(quiltPackage());
});
