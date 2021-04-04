import type {EmailType, PropsForEmail} from '../../../email';

export async function sendEmail<T extends EmailType>(
  type: T,
  props: PropsForEmail<T>,
) {
  const {SQS} = await import('aws-sdk');

  const sqs = new SQS();

  const message: import('aws-sdk').SQS.Types.SendMessageRequest = {
    QueueUrl: process.env.EMAIL_QUEUE_URL!,
    MessageBody: JSON.stringify(props),
    MessageAttributes: {
      type: {StringValue: type, DataType: 'String'},
    },
  };

  await sqs.sendMessage(message).promise();
}
