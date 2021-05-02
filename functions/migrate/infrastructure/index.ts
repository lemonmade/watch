import {Duration} from '@aws-cdk/core';

import type {GlobalInfrastructureStack} from 'global/infrastructure';
import {
  Stack,
  Construct,
  QuiltServiceLambda,
  PrismaLayer,
} from 'global/utilities/infrastructure';

export class MigratePrimaryDatabaseStack extends Stack {
  constructor(
    parent: Construct,
    {global: {primaryDatabase}}: {global: GlobalInfrastructureStack},
  ) {
    super(parent, 'WatchMigratePrimaryDatabaseStack');

    const migrateFunction = new QuiltServiceLambda(
      this,
      'WatchMigratePrimaryDatabaseFunction',
      {
        name: 'email',
        vpc: primaryDatabase.vpc,
        timeout: Duration.minutes(5),
        layers: [
          new PrismaLayer(
            this,
            'WatchMigratePrimaryDatabaseFunctionPrismaLayer',
            {
              action: 'migrate',
            },
          ),
        ],
        functionName: 'WatchMigratePrimaryDatabaseFunction',
      },
    );

    primaryDatabase.grantAccess(migrateFunction);
  }
}
