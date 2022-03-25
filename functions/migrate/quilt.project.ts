import {createService, quiltService, createProjectPlugin} from '@quilted/craft';
import {lambda} from '@quilted/aws/craft';

import {prisma} from '../../config/craft/plugins';

export default createService((service) => {
  service.entry('./migrate');
  service.use(
    quiltService({develop: false, httpHandler: false}),
    lambda(),
    prisma(),
    createProjectPlugin({
      name: 'Watch.Migrate.CopyPrisma',
      build({project, workspace, run}) {
        run((step) =>
          step({
            name: 'Watch.Migrate.CopyPrisma',
            label: 'Copy prisma artifacts',
            async run(runner) {
              await runner.exec('cp', [
                '-r',
                workspace.fs.resolvePath('prisma'),
                project.fs.buildPath('runtime'),
              ]);
            },
          }),
        );
      },
    }),
  );
});
