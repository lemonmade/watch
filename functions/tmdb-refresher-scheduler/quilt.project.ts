import {createService, quiltService} from '@quilted/craft';
import {lambda} from '@quilted/aws/craft';

import {prisma} from '../../config/craft/plugins';

export default createService((service) => {
  service.entry('./tmdb-refresher-scheduler');
  service.use(
    quiltService({develop: false, httpHandler: false}),
    lambda(),
    prisma(),
  );
});
