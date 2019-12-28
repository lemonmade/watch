import {createPackage} from '@sewing-kit/config';
import {webpack} from '@sewing-kit/plugin-webpack';
import {storybook} from 'sewing-kit-plugin-storybook';

import {quiltPackage} from '@quilted/sewing-kit-plugins';

export default createPackage((pkg) => {
  pkg.entry({root: './src/index'});
  pkg.use(quiltPackage());
  pkg.use(webpack(), storybook({port: 8083}));
});
