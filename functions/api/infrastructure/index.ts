import {HttpApi} from '@aws-cdk/aws-apigatewayv2';
import {LambdaProxyIntegration} from '@aws-cdk/aws-apigatewayv2-integrations';

import {
  Construct,
  Database,
  JsonWebToken,
  PublicBucket,
  QuiltServiceLambda,
  TMDB_ENVIRONMENT_VARIABLES,
} from '../../../global/utilities/infrastructure';

import type {Email} from '../../email/infrastructure';

export class GraphQLApi extends Construct {
  readonly clipsBucket: PublicBucket;
  private readonly api: HttpApi;

  get endpoint() {
    return this.api.url!;
  }

  constructor(
    parent: Construct,
    {
      jwt,
      email,
      database,
    }: {
      jwt: JsonWebToken;
      email: Email;
      database: Database;
    },
  ) {
    super(parent, 'WatchGraphQLApi');

    this.clipsBucket = new PublicBucket(this, 'WatchClipsAssetsBucket', {
      bucketName: 'watch-assets-clips',
    });

    const graphqlFunction = new QuiltServiceLambda(
      this,
      'WatchGraphQLFunction',
      {
        name: 'api',
        public: true,
        vpc: database.vpc,
        functionName: 'WatchGraphQLFunction',
        layers: [database.layers.query],
        environment: {
          // ...TMDB_ENVIRONMENT_VARIABLES,
          ...database.environmentVariables,
          ...TMDB_ENVIRONMENT_VARIABLES,
          EMAIL_QUEUE_URL: email.queueUrl,
          JWT_DEFAULT_SECRET: jwt.secret,
        },
      },
    );

    database.grantAccess(graphqlFunction);

    email.grantSend(graphqlFunction);

    this.clipsBucket.grantPut(graphqlFunction);

    this.api = new HttpApi(this, 'WatchGraphQLHttpApi', {
      defaultIntegration: new LambdaProxyIntegration({
        handler: graphqlFunction,
      }),
    });
  }
}
