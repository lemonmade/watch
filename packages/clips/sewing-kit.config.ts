import {createPackage} from '@sewing-kit/config';

import {quiltPackage} from '@quilted/sewing-kit-plugins';
import {buildFlexibleOutputs} from '@sewing-kit/plugin-package-flexible-outputs';

export default createPackage((pkg) => {
  pkg.entry({root: './src/index'});
  pkg.entry({name: 'react', root: './src/react/index'});
  pkg.entry({name: 'vue', root: './src/vue/index'});
  pkg.use(quiltPackage(), buildFlexibleOutputs());
});
