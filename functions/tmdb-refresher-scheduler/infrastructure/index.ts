import {Queue} from '@aws-cdk/aws-sqs';
import {Rule, Schedule} from '@aws-cdk/aws-events';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';

import {
  Construct,
  Database,
  QuiltServiceLambda,
} from '../../../global/utilities/infrastructure';

export class TmdbRefresherScheduler extends Construct {
  readonly queue: Queue;

  get queueUrl() {
    return this.queue.queueUrl;
  }

  constructor(parent: Construct, {database}: {database: Database}) {
    super(parent, 'WatchTmdbRefresherScheduler');

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
        vpc: database.vpc,
        layers: [database.layers.query],
        functionName: 'WatchTmdbRefresherSchedulerFunction',
        environment: {...database.environmentVariables},
      },
    );

    database.grantAccess(schedulerFunction);
    this.queue.grantSendMessages(schedulerFunction);

    new Rule(this, 'WatchTmdbRefresherRule', {
      ruleName: 'WatchTmdbRefresherRule',
      schedule: Schedule.cron({hour: '10', minute: '15'}),
      targets: [new LambdaFunction(schedulerFunction)],
    });
  }
}
