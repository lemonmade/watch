import {Queue} from '@aws-cdk/aws-sqs';
import {Rule, Schedule} from '@aws-cdk/aws-events';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';

import type {GlobalInfrastructureStack} from '../../../global/infrastructure';
import {
  Stack,
  Construct,
  QuiltServiceLambda,
  PrismaLayer,
} from '../../../global/utilities/infrastructure';

export class TmdbRefresherSchedulerStack extends Stack {
  readonly queue: Queue;

  get queueUrl() {
    return this.queue.queueUrl;
  }

  constructor(
    parent: Construct,
    {global}: {global: GlobalInfrastructureStack},
  ) {
    super(parent, 'WatchTmdbRefresherSchedulerStack', {dependencies: [global]});

    const {primaryDatabase} = global;

    this.queue = new Queue(this, 'WatchTmdbRefresherQueue', {
      queueName: 'WatchTmdbRefresherQueue',
      deadLetterQueue: {
        queue: new Queue(this, 'WatchTmdbRefresherDeadLetterQueue', {
          queueName: 'WatchTmdbRefresherDeadLetterQueue',
        }),
        maxReceiveCount: 5,
      },
    });

    const schedulerFunction = new QuiltServiceLambda(
      this,
      'WatchTmdbRefresherSchedulerFunction',
      {
        name: 'tmdb-refresher-scheduler',
        vpc: primaryDatabase.vpc,
        layers: [
          new PrismaLayer(
            this,
            'WatchTmdbRefresherSchedulerFunctionPrismaLayer',
            {
              action: 'query',
            },
          ),
        ],
        functionName: 'WatchTmdbRefresherSchedulerFunction',
        environment: {...primaryDatabase.environmentVariables},
      },
    );

    primaryDatabase.grantAccess(schedulerFunction);
    this.queue.grantSendMessages(schedulerFunction);

    new Rule(this, 'WatchTmdbRefresherRule', {
      ruleName: 'WatchTmdbRefresherRule',
      schedule: Schedule.cron({hour: '10', minute: '15'}),
      targets: [new LambdaFunction(schedulerFunction)],
    });
  }
}
