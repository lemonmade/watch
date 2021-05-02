import {Duration} from '@aws-cdk/core';

import {
  Construct,
  QuiltServiceLambda,
  Database,
} from '../../../global/utilities/infrastructure';

export class MigrateDatabase extends Construct {
  constructor(parent: Construct, {database}: {database: Database}) {
    super(parent, 'WatchMigratePrimaryDatabase');

    const migrateFunction = new QuiltServiceLambda(
      this,
      'WatchMigratePrimaryDatabaseFunction',
      {
        name: 'migrate',
        vpc: database.vpc,
        timeout: Duration.minutes(5),
        layers: [database.layers.migrate],
        functionName: 'WatchMigratePrimaryDatabaseFunction',
        environment: {...database.environmentVariables},
      },
    );

    database.grantAccess(migrateFunction);
  }
}
