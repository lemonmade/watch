import type {SQS} from 'aws-sdk';
import Env from '@quilted/quilt/env';
import type {EmailType, PropsForEmail} from '../../../../../functions/email';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    EMAIL_QUEUE_URL: string;
  }
}

// TODO
export async function enqueueSendEmail<T extends EmailType>(
  type: T,
  props: PropsForEmail<T>,
) {
  const {default: SQS} = await import('aws-sdk/clients/sqs');

  const sqs = new SQS();

  const message: SQS.Types.SendMessageRequest = {
    QueueUrl: Env.EMAIL_QUEUE_URL,
    MessageBody: JSON.stringify(props),
    MessageAttributes: {
      type: {StringValue: type, DataType: 'String'},
    },
  };

  await sqs.sendMessage(message).promise();
}
