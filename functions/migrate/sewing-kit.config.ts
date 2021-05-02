import {createService} from '@sewing-kit/config';
import {createProjectBuildPlugin} from '@sewing-kit/plugins';
import {quiltService} from '@quilted/sewing-kit-plugins';

import {lambdaBuild} from '../../config/sewing-kit/plugins';

export default createService((service) => {
  service.entry('./index');
  service.use(
    quiltService({devServer: false, build: false}),
    lambdaBuild(),
    createProjectBuildPlugin(
      'Watch.Migrate.CopyPrisma',
      ({api, hooks, workspace}) => {
        hooks.steps.hook((steps) => [
          ...steps,
          api.createStep(
            {id: 'Watch.Migrate.CopyPrisma', label: 'Copy prisma artifacts'},
            async (step) => {
              await step.exec('cp', [
                '-r',
                workspace.fs.resolvePath('prisma'),
                workspace.fs.buildPath('services/migrate/prisma'),
              ]);
            },
          ),
        ]);
      },
    ),
  );
});
