import {createPackage} from '@sewing-kit/config';

import {quiltPackage} from '@quilted/sewing-kit-plugins';
import {buildFlexibleOutputs} from '@sewing-kit/plugin-package-flexible-outputs';

export default createPackage((pkg) => {
  pkg.entry({root: './src/index'});
  pkg.use(quiltPackage({react: false}), buildFlexibleOutputs());
});
