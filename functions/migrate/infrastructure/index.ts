import {Duration} from '@aws-cdk/core';

import type {GlobalInfrastructureStack} from 'global/infrastructure';
import {
  Stack,
  Construct,
  QuiltServiceLambda,
} from 'global/utilities/infrastructure';

export class MigratePrimaryDatabaseStack extends Stack {
  constructor(
    parent: Construct,
    {global: {primaryDatabase, layers}}: {global: GlobalInfrastructureStack},
  ) {
    super(parent, 'WatchMigratePrimaryDatabaseStack');

    const migrateFunction = new QuiltServiceLambda(
      this,
      'WatchMigratePrimaryDatabaseFunction',
      {
        name: 'email',
        vpc: primaryDatabase.vpc,
        timeout: Duration.minutes(5),
        layers: [layers.prisma.migrate],
        functionName: 'WatchMigratePrimaryDatabaseFunction',
      },
    );

    primaryDatabase.grantAccess(migrateFunction);
  }
}
