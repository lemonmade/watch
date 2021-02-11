import {createPackage, Runtime} from '@sewing-kit/config';
import {quiltPackage} from '@quilted/sewing-kit-plugins';
import {publicPackage} from '../../config/sewing-kit/plugins';

export default createPackage((pkg) => {
  pkg.entry({
    root: 'src/worker',
    name: 'worker',
    runtime: Runtime.WebWorker,
  });
  pkg.entry({
    root: 'src/websocket',
    name: 'websocket',
    runtimes: [Runtime.Browser, Runtime.WebWorker],
  });
  pkg.entry({
    root: 'src/server',
    name: 'server',
    runtime: Runtime.Node,
  });
  pkg.entry({
    root: 'src/webpack-parts',
    name: 'webpack',
    runtime: Runtime.Node,
  });
  pkg.use(quiltPackage({react: false}), publicPackage());
});
