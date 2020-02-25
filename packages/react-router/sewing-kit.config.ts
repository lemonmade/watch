import {createPackage} from '@sewing-kit/config';

import {quiltPackage} from '@quilted/sewing-kit-plugins';

export default createPackage((pkg) => {
  pkg.entry({root: './src/index'});
  pkg.use(quiltPackage());
});
