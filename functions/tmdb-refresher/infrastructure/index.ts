import {SqsEventSource} from '@aws-cdk/aws-lambda-event-sources';

import type {GlobalInfrastructureStack} from '../../../global/infrastructure';
import {
  Stack,
  Construct,
  QuiltServiceLambda,
} from '../../../global/utilities/infrastructure';

import type {TmdbRefresherSchedulerStack} from '../../tmdb-refresher-scheduler/infrastructure';

export class TmdbRefresherStack extends Stack {
  constructor(
    parent: Construct,
    {
      scheduler,
      global,
    }: {
      global: GlobalInfrastructureStack;
      scheduler: TmdbRefresherSchedulerStack;
    },
  ) {
    super(parent, 'WatchTmdbRefresherStack', {
      dependencies: [global, scheduler],
    });

    const {primaryDatabase, layers} = global;

    const refresherFunction = new QuiltServiceLambda(
      this,
      'WatchTmdbRefresherFunction',
      {
        name: 'tmdb-refresher',
        vpc: primaryDatabase.vpc,
        layers: [layers.prisma.query],
        functionName: 'WatchTmdbRefresherFunction',
        environment: {
          ...primaryDatabase.environmentVariables,
          TMDB_REFRESHER_QUEUE_URL: scheduler.queueUrl,
        },
      },
    );

    primaryDatabase.grantAccess(refresherFunction);
    refresherFunction.addEventSource(new SqsEventSource(scheduler.queue));
  }
}
