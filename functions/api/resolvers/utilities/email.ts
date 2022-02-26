import type {SQS} from 'aws-sdk';
import type {EmailType, PropsForEmail} from '../../../email';

export async function enqueueSendEmail<T extends EmailType>(
  type: T,
  props: PropsForEmail<T>,
) {
  const {SQS} = await import('aws-sdk');

  const sqs = new SQS();

  const message: SQS.Types.SendMessageRequest = {
    QueueUrl: process.env.EMAIL_QUEUE_URL!,
    MessageBody: JSON.stringify(props),
    MessageAttributes: {
      type: {StringValue: type, DataType: 'String'},
    },
  };

  await sqs.sendMessage(message).promise();
}
