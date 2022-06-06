import {Rule, Schedule} from '@aws-cdk/aws-events';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';

import {
  Construct,
  Database,
  QuiltServiceLambda,
} from '../../../global/infrastructure';

import type {TmdbRefresher} from '../../tmdb-refresher/infrastructure';

export class TmdbRefresherScheduler extends Construct {
  constructor(
    parent: Construct,
    {database, refresher}: {database: Database; refresher: TmdbRefresher},
  ) {
    super(parent, 'WatchTmdbRefresherScheduler');

    const schedulerFunction = new QuiltServiceLambda(
      this,
      'WatchTmdbRefresherSchedulerFunction',
      {
        name: 'tmdb-refresher-scheduler',
        vpc: database.vpc,
        layers: [database.layers.query],
        functionName: 'WatchTmdbRefresherSchedulerFunction',
        environment: {
          ...database.environmentVariables,
          TMDB_REFRESHER_QUEUE_URL: refresher.queueUrl,
        },
      },
    );

    database.grantAccess(schedulerFunction);
    refresher.queue.grantSendMessages(schedulerFunction);

    new Rule(this, 'WatchTmdbRefresherRule', {
      ruleName: 'WatchTmdbRefresherRule',
      schedule: Schedule.cron({hour: '10', minute: '15'}),
      targets: [new LambdaFunction(schedulerFunction)],
    });
  }
}
