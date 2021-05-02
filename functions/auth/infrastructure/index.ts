import {HttpApi} from '@aws-cdk/aws-apigatewayv2';
import {LambdaProxyIntegration} from '@aws-cdk/aws-apigatewayv2-integrations';

import type {GlobalInfrastructureStack} from '../../../global/infrastructure';
import {
  Stack,
  Construct,
  QuiltServiceLambda,
} from '../../../global/utilities/infrastructure';

export class AuthApiStack extends Stack {
  private readonly api: HttpApi;

  get endpoint() {
    return this.api.url!;
  }

  constructor(
    parent: Construct,
    {global}: {global: GlobalInfrastructureStack},
  ) {
    super(parent, 'WatchAuthStack', {dependencies: [global]});

    const {primaryDatabase, layers} = global;

    const authFunction = new QuiltServiceLambda(this, 'WatchAuthFunction', {
      name: 'api',
      public: true,
      vpc: primaryDatabase.vpc,
      layers: [layers.prisma.query],
      functionName: 'WatchAuthFunction',
      environment: {
        ...primaryDatabase.environmentVariables,
      },
    });

    primaryDatabase.grantAccess(authFunction);

    this.api = new HttpApi(this, 'WatchAuthHttpApi', {
      defaultIntegration: new LambdaProxyIntegration({
        handler: authFunction,
      }),
    });
  }
}
