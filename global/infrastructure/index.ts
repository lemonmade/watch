/* eslint import/no-extraneous-dependencies: off */

import {Vpc} from '@aws-cdk/aws-ec2';
import {LayerVersion, AssetCode} from '@aws-cdk/aws-lambda';
import {
  Stack,
  Database,
  PublicBucket,
  Construct,
  buildPath,
} from '../utilities/infrastructure';

export class GlobalInfrastructureStack extends Stack {
  readonly primaryDatabase: Database;
  readonly appAssetsBucket: PublicBucket;
  readonly clipsAssetsBucket: PublicBucket;
  readonly layers: {
    readonly prisma: {
      readonly query: LayerVersion;
      readonly migrate: LayerVersion;
    };
  };

  constructor(construct: Construct) {
    super(construct, 'WatchGlobalInfrastructureStack');

    this.appAssetsBucket = new PublicBucket(this, 'WatchAppAssetsBucket', {
      bucketName: 'watch-assets-app',
    });

    this.clipsAssetsBucket = new PublicBucket(this, 'WatchClipsAssetsBucket', {
      bucketName: 'watch-assets-clips',
    });

    this.primaryDatabase = new Database(this, {
      vpc: new Vpc(this, 'WatchVpc'),
      name: 'PrimaryDatabase',
      databaseName: 'watch',
    });

    this.layers = {
      prisma: {
        query: new LayerVersion(this, 'WatchPrismaQueryLayer', {
          code: AssetCode.fromAsset(buildPath('layers/prisma-query')),
        }),
        migrate: new LayerVersion(this, 'WatchPrismaMigrateLayer', {
          code: AssetCode.fromAsset(buildPath('layers/prisma-migrate')),
        }),
      },
    };
  }
}
