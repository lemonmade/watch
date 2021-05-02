import {SqsEventSource} from '@aws-cdk/aws-lambda-event-sources';

import {
  Construct,
  QuiltServiceLambda,
  Database,
  Secret,
} from '../../../global/utilities/infrastructure';

import type {TmdbRefresherScheduler} from '../../tmdb-refresher-scheduler/infrastructure';

export class TmdbRefresher extends Construct {
  constructor(
    parent: Construct,
    {
      tmdb,
      database,
      scheduler,
    }: {
      tmdb: Secret;
      database: Database;
      scheduler: TmdbRefresherScheduler;
    },
  ) {
    super(parent, 'WatchTmdbRefresher');

    const refresherFunction = new QuiltServiceLambda(
      this,
      'WatchTmdbRefresherFunction',
      {
        name: 'tmdb-refresher',
        vpc: database.vpc,
        layers: [database.layers.query],
        functionName: 'WatchTmdbRefresherFunction',
        environment: {
          ...database.environmentVariables,
          TMDB_ACCESS_TOKEN: tmdb.asEnvironmentVariable({key: 'token'}),
          TMDB_REFRESHER_QUEUE_URL: scheduler.queueUrl,
        },
      },
    );

    database.grantAccess(refresherFunction);
    refresherFunction.addEventSource(new SqsEventSource(scheduler.queue));
  }
}
