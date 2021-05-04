import {Duration} from '@aws-cdk/core';

import {Secret} from '@aws-cdk/aws-secretsmanager';
import {Vpc} from '@aws-cdk/aws-ec2';
import {DatabaseInstance} from '@aws-cdk/aws-rds';

import {
  Construct,
  QuiltServiceLambda,
  PrismaLayer,
} from '../../../global/utilities/infrastructure';

export class MigrateDatabase extends Construct {
  constructor(parent: Construct) {
    super(parent, 'WatchMigratePrimaryDatabase');

    const vpc = Vpc.fromLookup(this, 'WatchMigratePrimaryDatabaseVpc', {
      vpcId: 'vpc-0f143b48e2f39fa56',
    });

    const database = DatabaseInstance.fromDatabaseInstanceAttributes(
      this,
      'WatchMigratePrimaryDatabaseInstance',
      {
        port: 5432,
        instanceIdentifier: 'ww1wg90k6hyulm3',
        instanceEndpointAddress:
          'ww1wg90k6hyulm3.cy3tl2imlret.us-east-1.rds.amazonaws.com',
        securityGroups: [],
      },
    );

    const databaseCredentialsSecret = new Secret(
      this,
      'WatchMigratePrimaryDatabaseCredentialsSecret',
      {
        secretName: 'Watch/PrimaryDatabase/Credentials',
      },
    );

    const layer = new PrismaLayer(
      this,
      'WatchMigratePrimaryDatabasePrismaLayer',
      {action: 'migrate'},
    );

    const migrateFunction = new QuiltServiceLambda(
      this,
      'WatchMigratePrimaryDatabaseFunction',
      {
        name: 'migrate',
        vpc,
        timeout: Duration.minutes(5),
        layers: [layer],
        functionName: 'WatchMigratePrimaryDatabaseFunction',
        environment: {
          DATABASE_PORT: database.dbInstanceEndpointPort,
          DATABASE_HOST: database.dbInstanceEndpointAddress,
          DATABASE_CREDENTIALS_SECRET: databaseCredentialsSecret.secretName,
        },
      },
    );

    database.grantConnect(migrateFunction);
    databaseCredentialsSecret.grantRead(migrateFunction);
  }
}
