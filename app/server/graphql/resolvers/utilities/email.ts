import Env from '@quilted/quilt/env';
import type {EmailType, PropsForEmail} from '../../../../../functions/email';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    EMAIL_TOPIC: string;
  }
}

// TODO
export async function enqueueSendEmail<T extends EmailType>(
  type: T,
  props: PropsForEmail<T>,
) {
  const {PubSub} = await import('@google-cloud/pubsub');

  const pubsub = new PubSub();

  await pubsub.topic(Env.EMAIL_TOPIC).publishMessage({
    json: {
      type,
      props,
    },
  });
}
