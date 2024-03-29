import {
  type Queue,
  type ExportedHandlerScheduledHandler,
} from '@cloudflare/workers-types';

import {createEdgeDatabaseConnection} from '~/global/database.ts';

import {type Message} from '../tmdb-refresher/tmdb-refresher.ts';

interface Environment {
  DATABASE_URL: string;
  TMDB_REFRESHER_QUEUE: Queue<Message>;
}

const scheduled: ExportedHandlerScheduledHandler<Environment> =
  async function scheduled(event, env) {
    console.log(event);

    try {
      const prisma = await createEdgeDatabaseConnection({
        url: env.DATABASE_URL,
      });

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
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

export default {
  scheduled,
};
