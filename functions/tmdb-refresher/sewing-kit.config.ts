import {createService} from '@sewing-kit/config';
import {quiltService} from '@quilted/sewing-kit-plugins';

import {lambdaBuild, knex} from '../../config/sewing-kit/plugins';

export default createService((service) => {
  service.entry('./index');
  service.use(quiltService({devServer: false}), knex(), lambdaBuild());
});
