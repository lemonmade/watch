import {createService} from '@sewing-kit/config';
import {quiltService} from '@quilted/sewing-kit-plugins';
import {lambda} from '@quilted/aws/sewing-kit';
import {
  webpackAliases,
  noopModuleWithWebpack,
} from '@sewing-kit/plugin-webpack';

import {
  functionConvenienceAliases,
  httpDev,
} from '../../config/sewing-kit/plugins';

const anyPromiseStub = require.resolve(
  '../../config/sewing-kit/stubs/any-promise.js',
);

export default createService((service) => {
  service.entry('./index');
  service.use(
    // quiltService({devServer: {ip: 'localhost', port: 8080}}),
    quiltService({devServer: false, features: ['base', 'fetch']}),
    webpackAliases({'any-promise': anyPromiseStub}),
    noopModuleWithWebpack(/vue-template-compiler/),
    lambda(),
    functionConvenienceAliases(),
    httpDev({port: 8910}),
  );
});
