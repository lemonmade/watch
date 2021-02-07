import {createPackage, Runtime} from '@sewing-kit/config';

import {quiltPackage} from '@quilted/sewing-kit-plugins';
import {buildFlexibleOutputs} from '@sewing-kit/plugin-package-flexible-outputs';

export default createPackage((pkg) => {
  pkg.runtime(Runtime.Node);
  pkg.entry({root: 'src/index'});
  pkg.binary({name: 'watchapp', root: 'src/cli'});
  pkg.use(quiltPackage({react: false}), buildFlexibleOutputs({node: true}));
});
