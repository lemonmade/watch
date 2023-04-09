/* eslint no-console: off */

import {
  type Queue,
  type ExportedHandlerScheduledHandler,
} from '@cloudflare/workers-types';

import {type Message} from '../tmdb-refresher/tmdb-refresher.ts';

interface Environment {
  DATABASE_URL: string;
  TMDB_REFRESHER_QUEUE: Queue<Message>;
}

const scheduled: ExportedHandlerScheduledHandler<Environment> =
  async function scheduled(event, env) {
    const {PrismaClient} = await import('@prisma/client/edge');

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: env.DATABASE_URL,
        },
      },
    });

    console.log(event);

    const series = await prisma.series.findMany({
      where: {status: 'RETURNING'},
    });

    console.log(series);

    await Promise.all(
      series.map(async (series) => {
        await env.TMDB_REFRESHER_QUEUE.send({
          id: series.id,
          name: series.name,
          tmdbId: series.tmdbId,
        });
      }),
    );
  };

export default {
  scheduled,
};
