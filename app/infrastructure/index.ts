import {Code} from '@aws-cdk/aws-lambda';
import {HttpApi} from '@aws-cdk/aws-apigatewayv2';
import {LambdaProxyIntegration} from '@aws-cdk/aws-apigatewayv2-integrations';
import {
  BucketDeployment,
  CacheControl,
  Source,
} from '@aws-cdk/aws-s3-deployment';

import {
  NodeLambda,
  Stack,
  Construct,
  buildPath,
  PublicBucket,
} from '../../global/utilities/infrastructure';

export class AppStack extends Stack {
  private readonly api: HttpApi;
  private readonly assets: AppAssetsStack;

  get endpoint() {
    return this.api.url!;
  }

  get assetsBucket() {
    return this.assets.bucket;
  }

  constructor(parent: Construct) {
    super(parent, 'WatchAppStack');

    this.assets = new AppAssetsStack(parent);

    const appFunction = new NodeLambda(this, 'WatchAppFunction', {
      public: true,
      functionName: 'WatchAppFunction',
      code: Code.fromAsset(buildPath('app/server')),
    });

    this.api = new HttpApi(this, 'WatchAppHttpApi', {
      defaultIntegration: new LambdaProxyIntegration({handler: appFunction}),
    });
  }
}

class AppAssetsStack extends Stack {
  readonly bucket: PublicBucket;

  constructor(parent: Construct) {
    super(parent, 'WatchAppAssetsStack');

    this.bucket = new PublicBucket(this, 'WatchAppAssetsBucket', {
      bucketName: 'watch-assets-app',
    });

    new BucketDeployment(this, 'WatchAppAssetsBucketDeployment', {
      sources: [
        Source.asset(buildPath('app/assets'), {exclude: ['*.html', '*.json']}),
      ],
      destinationBucket: this.bucket,
      destinationKeyPrefix: 'assets/app',
      prune: false,
      cacheControl: [
        CacheControl.fromString(
          `public, max-age=${60 * 60 * 24 * 365}, immutable`,
        ),
      ],
    });
  }
}
