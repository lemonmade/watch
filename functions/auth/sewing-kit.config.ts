import {createService} from '@sewing-kit/config';
import {quiltService} from '@quilted/sewing-kit-plugins';
import {lambda} from '@quilted/aws/sewing-kit';

import {
  knex,
  functionConvenienceAliases,
} from '../../config/sewing-kit/plugins';

export default createService((service) => {
  service.entry('./index');
  service.use(
    quiltService({devServer: false, features: ['base', 'fetch']}),
    knex(),
    lambda(),
    functionConvenienceAliases(),
  );
});
