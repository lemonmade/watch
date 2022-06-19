import Env from '@quilted/quilt/env';
import type {EmailType, PropsForEmail} from '../../../../../functions/email';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    GOOGLE_CLOUD_PROJECT_ID: string;
    GOOGLE_CLOUD_CREDENTIALS: string;
    GOOGLE_CLOUD_EMAIL_TOPIC: string;
  }
}

// TODO
export async function enqueueSendEmail<T extends EmailType>(
  type: T,
  props: PropsForEmail<T>,
) {
  const {PubSub} = await import('@google-cloud/pubsub');

  const pubsub = new PubSub({
    projectId: Env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: JSON.parse(Env.GOOGLE_CLOUD_CREDENTIALS),
  });

  await pubsub.topic(Env.GOOGLE_CLOUD_EMAIL_TOPIC).publishMessage({
    json: {
      type,
      props,
    },
  });
}
