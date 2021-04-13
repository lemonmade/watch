import {createService} from '@sewing-kit/config';
import {quiltService} from '@quilted/sewing-kit-plugins';

import {
  knex,
  functionConvenienceAliases,
} from '../../config/sewing-kit/plugins';

export default createService((service) => {
  service.entry('./index');
  service.use(
    // Would like to use `features`, but they get overwritten by the default
    // server build...
    quiltService({devServer: false /* , features: ['base', 'fetch'] */}),
    knex(),
    functionConvenienceAliases(),
  );
});
