import {createService} from '@sewing-kit/config';
import {quiltService} from '@quilted/sewing-kit-plugins';
import {lambda} from '@quilted/aws/sewing-kit';
import {
  webpackExternals,
  noopModuleWithWebpack,
} from '@sewing-kit/plugin-webpack';

import {
  functionConvenienceAliases,
  httpDev,
} from '../../config/sewing-kit/plugins';

export default createService((service) => {
  service.entry('./index');
  service.use(
    // quiltService({devServer: {ip: 'localhost', port: 8080}}),
    quiltService({devServer: false, features: ['base', 'fetch']}),
    // @graphql-tools depends on this for some reason, and it fails
    // to build because vue is an optional, uninstalled dependency.
    noopModuleWithWebpack(/vue-template-compiler/),
    lambda(),
    functionConvenienceAliases(),
    httpDev({port: 8910}),
    webpackExternals(['@prisma/client']),
  );
});
