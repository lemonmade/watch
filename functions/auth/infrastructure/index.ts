import {HttpApi} from '@aws-cdk/aws-apigatewayv2';
import {LambdaProxyIntegration} from '@aws-cdk/aws-apigatewayv2-integrations';

import {
  Construct,
  QuiltServiceLambda,
  Database,
  JsonWebToken,
  GITHUB_OAUTH_ENVIRONMENT_VARIABLES,
} from '../../../global/utilities/infrastructure';

export class AuthApi extends Construct {
  private readonly api: HttpApi;

  get endpoint() {
    return this.api.url!;
  }

  constructor(
    parent: Construct,
    {database, jwt}: {database: Database; jwt: JsonWebToken},
  ) {
    super(parent, 'WatchAuth');

    const authFunction = new QuiltServiceLambda(this, 'WatchAuthFunction', {
      name: 'auth',
      public: true,
      vpc: database.vpc,
      layers: [database.layers.query],
      functionName: 'WatchAuthFunction',
      environment: {
        ...database.environmentVariables,
        ...GITHUB_OAUTH_ENVIRONMENT_VARIABLES,
        JWT_DEFAULT_SECRET: jwt.secret,
      },
    });

    database.grantAccess(authFunction);

    this.api = new HttpApi(this, 'WatchAuthHttpApi', {
      defaultIntegration: new LambdaProxyIntegration({
        handler: authFunction,
      }),
    });
  }
}
