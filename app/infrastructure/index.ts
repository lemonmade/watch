import * as path from 'path';

import {
  BucketDeployment,
  CacheControl,
  Source,
} from '@aws-cdk/aws-s3-deployment';

import {Construct, PublicBucket} from '../../global/utilities/infrastructure';

const root = path.resolve(__dirname, '..');

export class WebApp extends Construct {
  private readonly assets: WebAppAssets;

  get assetsBucket() {
    return this.assets.bucket;
  }

  constructor(parent: Construct) {
    super(parent, 'WatchWebApp');

    this.assets = new WebAppAssets(parent);
  }
}

class WebAppAssets extends Construct {
  readonly bucket: PublicBucket;

  constructor(parent: Construct) {
    super(parent, 'WatchWebAppAssetsStack');

    this.bucket = new PublicBucket(this, 'WatchWebAppAssetsBucket', {
      bucketName: 'watch-assets-app',
    });

    new BucketDeployment(this, 'WatchWebAppAssetsBucketDeployment', {
      sources: [
        Source.asset(buildPath('assets'), {exclude: ['*.html', '*.json']}),
      ],
      destinationBucket: this.bucket,
      destinationKeyPrefix: 'assets',
      prune: false,
      cacheControl: [
        CacheControl.fromString(
          `public, max-age=${60 * 60 * 24 * 365}, immutable`,
        ),
      ],
    });
  }
}

function buildPath(...parts: string[]) {
  return path.resolve(root, 'build', ...parts);
}
