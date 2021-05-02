import {HttpApi} from '@aws-cdk/aws-apigatewayv2';
import {LambdaProxyIntegration} from '@aws-cdk/aws-apigatewayv2-integrations';

import type {GlobalInfrastructureStack} from '../../../global/infrastructure';
import {
  Stack,
  Construct,
  QuiltServiceLambda,
} from '../../../global/utilities/infrastructure';

import type {EmailStack} from '../../email/infrastructure';

export class GraphQLApiStack extends Stack {
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
      dependencies: [global, email],
    });

    const {primaryDatabase, clipsAssetsBucket, layers} = global;

    const graphqlFunction = new QuiltServiceLambda(this, 'WatchEmailFunction', {
      name: 'api',
      public: true,
      vpc: primaryDatabase.vpc,
      functionName: 'WatchGraphQLFunction',
      layers: [layers.prisma.query],
      environment: {
        // ...TMDB_ENVIRONMENT_VARIABLES,
        ...primaryDatabase.environmentVariables,
        EMAIL_QUEUE_URL: email.queueUrl,
      },
    });

    primaryDatabase.grantAccess(graphqlFunction);

    email.grantSend(graphqlFunction);
    clipsAssetsBucket.grantPut(graphqlFunction);

    this.api = new HttpApi(this, 'WatchGraphQLHttpApi', {
      defaultIntegration: new LambdaProxyIntegration({
        handler: graphqlFunction,
      }),
    });
  }
}
