import {HttpApi} from '@aws-cdk/aws-apigatewayv2';
import {LambdaProxyIntegration} from '@aws-cdk/aws-apigatewayv2-integrations';

import type {GlobalInfrastructureStack} from '../../../global/infrastructure';
import {
  Stack,
  Construct,
  QuiltServiceLambda,
  GITHUB_OAUTH_ENVIRONMENT_VARIABLES,
  PrismaLayer,
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

    const {primaryDatabase} = global;

    const authFunction = new QuiltServiceLambda(this, 'WatchAuthFunction', {
      name: 'auth',
      public: true,
      vpc: primaryDatabase.vpc,
      layers: [
        new PrismaLayer(this, 'WatchAuthFunctionPrismaLayer', {
          action: 'query',
        }),
      ],
      functionName: 'WatchAuthFunction',
      environment: {
        ...primaryDatabase.environmentVariables,
        ...GITHUB_OAUTH_ENVIRONMENT_VARIABLES,
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
