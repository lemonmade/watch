import {Duration} from '@aws-cdk/core';
import {HttpApi} from '@aws-cdk/aws-apigatewayv2';
import {LambdaProxyIntegration} from '@aws-cdk/aws-apigatewayv2-integrations';

import {
  Construct,
  Database,
  Secret,
  PublicBucket,
  QuiltServiceLambda,
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
      tmdb,
      email,
      database,
    }: {
      jwt: Secret;
      tmdb: Secret;
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
        timeout: Duration.seconds(30),
        environment: {
          ...database.environmentVariables,
          TMDB_ACCESS_TOKEN: tmdb.asEnvironmentVariable({key: 'token'}),
          EMAIL_QUEUE_URL: email.queueUrl,
          JWT_DEFAULT_SECRET: jwt.asEnvironmentVariable({key: 'secret'}),
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
