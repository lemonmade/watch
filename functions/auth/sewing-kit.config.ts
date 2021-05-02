import {createService} from '@sewing-kit/config';
import {quiltService} from '@quilted/sewing-kit-plugins';
import {lambda} from '@quilted/aws/sewing-kit';
import {webpackExternals} from '@sewing-kit/plugin-webpack';

import {
  httpDev,
  functionConvenienceAliases,
} from '../../config/sewing-kit/plugins';

export default createService((service) => {
  service.entry('./index');
  service.use(
    quiltService({devServer: false, features: ['base', 'fetch']}),
    lambda(),
    functionConvenienceAliases(),
    httpDev({port: 8911}),
    webpackExternals(['@prisma/client']),
  );
});
