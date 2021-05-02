import {Queue} from '@aws-cdk/aws-sqs';
import {SqsEventSource} from '@aws-cdk/aws-lambda-event-sources';
import {PolicyStatement, Effect} from '@aws-cdk/aws-iam';

import type {GlobalInfrastructureStack} from '../../../global/infrastructure';
import {
  Stack,
  Construct,
  Grantable,
  QuiltServiceLambda,
} from '../../../global/utilities/infrastructure';

export class EmailStack extends Stack {
  private readonly queue: Queue;

  get queueUrl() {
    return this.queue.queueUrl;
  }

  constructor(
    parent: Construct,
    {global}: {global: GlobalInfrastructureStack},
  ) {
    super(parent, 'WatchEmailStack', {dependencies: [global]});

    const {primaryDatabase} = global;

    this.queue = new Queue(this, 'WatchEmailQueue', {
      queueName: 'WatchEmailQueue',
      deadLetterQueue: {
        queue: new Queue(this, 'WatchEmailDeadLetterQueue', {
          queueName: 'WatchEmailDeadLetterQueue',
        }),
        maxReceiveCount: 5,
      },
    });

    const emailFunction = new QuiltServiceLambda(this, 'WatchEmailFunction', {
      name: 'email',
      vpc: primaryDatabase.vpc,
      functionName: 'WatchEmailFunction',
    });

    emailFunction.addEventSource(new SqsEventSource(this.queue));
    emailFunction.addToRolePolicy(
      new PolicyStatement({
        actions: ['ses:SendEmail', 'SES:SendRawEmail'],
        resources: ['*'],
        effect: Effect.ALLOW,
      }),
    );
  }

  grantSend(grantable: Grantable) {
    this.queue.grantSendMessages(grantable);
  }
}
