import {Code} from '@aws-cdk/aws-lambda';
import {HttpApi} from '@aws-cdk/aws-apigatewayv2';
import {LambdaProxyIntegration} from '@aws-cdk/aws-apigatewayv2-integrations';

import {
  NodeLambda,
  Stack,
  Construct,
  buildPath,
} from '../../global/utilities/infrastructure';

export class AppStack extends Stack {
  private readonly api: HttpApi;

  get endpoint() {
    return this.api.url!;
  }

  constructor(parent: Construct) {
    super(parent, 'WatchAppStack');

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
