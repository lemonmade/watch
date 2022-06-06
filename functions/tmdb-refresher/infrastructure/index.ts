import {SqsEventSource} from '@aws-cdk/aws-lambda-event-sources';
import {Queue} from '@aws-cdk/aws-sqs';

import {
  Construct,
  QuiltServiceLambda,
  Database,
  Secret,
} from '../../../global/infrastructure';

export class TmdbRefresher extends Construct {
  readonly queue: Queue;

  get queueUrl() {
    return this.queue.queueUrl;
  }

  constructor(
    parent: Construct,
    {
      tmdb,
      database,
    }: {
      tmdb: Secret;
      database: Database;
    },
  ) {
    super(parent, 'WatchTmdbRefresher');

    this.queue = new Queue(this, 'WatchTmdbRefresherFunctionQueue', {
      queueName: 'WatchTmdbRefresherFunctionQueue',
      deadLetterQueue: {
        queue: new Queue(this, 'WatchTmdbRefresherFunctionDeadLetterQueue', {
          queueName: 'WatchTmdbRefresherFunctionDeadLetterQueue',
        }),
        maxReceiveCount: 5,
      },
    });

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
        },
      },
    );

    database.grantAccess(refresherFunction);
    refresherFunction.addEventSource(new SqsEventSource(this.queue));
  }
}
