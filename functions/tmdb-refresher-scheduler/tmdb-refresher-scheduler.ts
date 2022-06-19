/* eslint no-console: off */

import {PubSub} from '@google-cloud/pubsub';
import {PrismaClient} from '@prisma/client';

import Env from '@quilted/quilt/env';

import {createPubSubHandler} from '~/shared/utilities/pubsub';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    TMDB_REFRESHER_TOPIC: string;
  }
}

const pubsub = new PubSub();
const prisma = new PrismaClient();

export default createPubSubHandler(async () => {
  const series = await prisma.series.findMany({
    where: {status: 'RETURNING'},
  });

  console.log(series);

  const topic = pubsub.topic(Env.TMDB_REFRESHER_TOPIC);

  await Promise.all(
    series.map((series) => {
      return topic.publishMessage({
        json: {
          id: series.id,
          name: series.name,
          tmdbId: series.tmdbId,
        },
      });
    }),
  );
});
