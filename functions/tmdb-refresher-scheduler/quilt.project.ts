import {createProject, quiltService} from '@quilted/craft';

import {prisma} from '../../config/craft/plugins';

export default createProject((service) => {
  service.use(
    quiltService({
      entry: './tmdb-refresher-scheduler.ts',
      develop: false,
    }),
    prisma(),
  );
});
