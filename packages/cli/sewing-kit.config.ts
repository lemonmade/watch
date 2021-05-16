import {createPackage} from '@sewing-kit/config';
import {quiltPackage} from '@quilted/sewing-kit-plugins';
import {publicPackage} from '../../config/sewing-kit/plugins';

export default createPackage((pkg) => {
  pkg.binary({name: 'watchapp', root: 'src/cli'});
  pkg.use(quiltPackage({react: false}), publicPackage({node: true}));
});
