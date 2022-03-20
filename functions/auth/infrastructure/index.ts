import {HttpApi} from '@aws-cdk/aws-apigatewayv2';
import {HttpLambdaIntegration} from '@aws-cdk/aws-apigatewayv2-integrations';

import {
  Construct,
  QuiltServiceLambda,
  Database,
  Secret,
} from '../../../global/utilities/infrastructure';

export class AuthApi extends Construct {
  private readonly api: HttpApi;

  get endpoint() {
    return this.api.url!;
  }

  constructor(
    parent: Construct,
    {database, jwt, github}: {database: Database; jwt: Secret; github: Secret},
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
        JWT_DEFAULT_SECRET: jwt.asEnvironmentVariable({key: 'secret'}),
        GITHUB_CLIENT_ID: github.asEnvironmentVariable({key: 'clientId'}),
        GITHUB_CLIENT_SECRET: github.asEnvironmentVariable({
          key: 'clientSecret',
        }),
      },
    });

    database.grantAccess(authFunction);

    this.api = new HttpApi(this, 'WatchAuthHttpApi', {
      defaultIntegration: new HttpLambdaIntegration(
        'WatchAuthLambdaIntegration',
        authFunction,
      ),
    });
  }
}
