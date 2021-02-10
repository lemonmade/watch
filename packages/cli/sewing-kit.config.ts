import {createPackage, Runtime} from '@sewing-kit/config';
import {quiltPackage} from '@quilted/sewing-kit-plugins';
import {publicPackage} from '../../config/sewing-kit/plugins';

export default createPackage((pkg) => {
  pkg.runtime(Runtime.Node);
  pkg.entry({
    root: 'src/dev/hot-client',
    name: 'hot-client',
    runtime: Runtime.WebWorker,
  });
  pkg.binary({name: 'watchapp', root: 'src/cli'});
  pkg.use(quiltPackage({react: false}), publicPackage({node: true}));
});
