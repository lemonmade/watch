import {createPackage} from '@sewing-kit/config';
import {quiltPackagePlugin} from '@quilted/sewing-kit-plugins';

export default createPackage((pkg) => {
  pkg.entry({root: './src/index'});
  pkg.plugin(quiltPackagePlugin);
});
