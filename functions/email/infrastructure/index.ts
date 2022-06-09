import {Queue} from '@aws-cdk/aws-sqs';
import {SqsEventSource} from '@aws-cdk/aws-lambda-event-sources';
import {PolicyStatement, Effect} from '@aws-cdk/aws-iam';

import {
  Construct,
  Grantable,
  QuiltServiceLambda,
} from '../../../global/infrastructure';

export class Email extends Construct {
  private readonly queue: Queue;

  get queueUrl() {
    return this.queue.queueUrl;
  }

  constructor(parent: Construct) {
    super(parent, 'WatchEmail');

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
