import {HttpApi} from '@aws-cdk/aws-apigatewayv2';
import {LambdaProxyIntegration} from '@aws-cdk/aws-apigatewayv2-integrations';

import type {GlobalInfrastructureStack} from '../../../global/infrastructure';
import {
  Stack,
  Construct,
  PublicBucket,
  QuiltServiceLambda,
  TMDB_ENVIRONMENT_VARIABLES,
  PrismaLayer,
} from '../../../global/utilities/infrastructure';

import type {EmailStack} from '../../email/infrastructure';

export class GraphQLApiStack extends Stack {
  readonly clipsBucket: PublicBucket;
  private readonly api: HttpApi;

  get endpoint() {
    return this.api.url!;
  }

  constructor(
    parent: Construct,
    {
      email,
      global,
    }: {
      global: GlobalInfrastructureStack;
      email: EmailStack;
    },
  ) {
    super(parent, 'WatchGraphQLApiStack', {
      dependencies: [],
    });

    const {primaryDatabase} = global;

    this.clipsBucket = new PublicBucket(this, 'WatchClipsAssetsBucket', {
      bucketName: 'watch-assets-clips',
    });

    const graphqlFunction = new QuiltServiceLambda(
      this,
      'WatchGraphQLFunction',
      {
        name: 'api',
        public: true,
        vpc: primaryDatabase.vpc,
        functionName: 'WatchGraphQLFunction',
        layers: [
          new PrismaLayer(this, 'WatchGraphQLFunctionPrismaLayer', {
            action: 'query',
          }),
        ],
        environment: {
          // ...TMDB_ENVIRONMENT_VARIABLES,
          ...primaryDatabase.environmentVariables,
          ...TMDB_ENVIRONMENT_VARIABLES,
          EMAIL_QUEUE_URL: email.queueUrl,
        },
      },
    );

    primaryDatabase.grantAccess(graphqlFunction);

    email.grantSend(graphqlFunction);

    this.clipsBucket.grantPut(graphqlFunction);

    this.api = new HttpApi(this, 'WatchGraphQLHttpApi', {
      defaultIntegration: new LambdaProxyIntegration({
        handler: graphqlFunction,
      }),
    });
  }
}
