import type {ScheduledEvent} from '@cloudflare/workers-types';
import {createPrisma, type Environment} from './shared';

export async function handleScheduled(event: ScheduledEvent, env: Environment) {
  console.log('Scheduled event:');
  console.log(JSON.stringify(event, null, 2));

  const prisma = await createPrisma(env.DATABASE_URL);

  const series = await prisma.series.findMany({
    where: {status: 'RETURNING'},
  });

  // Max queue size is 100
  // @see https://developers.cloudflare.com/queues/reference/javascript-apis/#queue

  const seriesBatches = [];

  while (series.length > 0) {
    seriesBatches.push(series.splice(0, 100));
  }

  console.log('Queuing updates to returning series:');
  console.log(
    series
      .map((series) => `${series.name} (tmdbId: ${series.tmdbId})`)
      .join('\n'),
  );

  await Promise.all(
    seriesBatches.map(async (batch) => {
      await env.TMDB_REFRESHER_QUEUE.sendBatch(
        batch.map((series) => ({
          body: {
            id: series.id,
            name: series.name,
            tmdbId: series.tmdbId,
          },
        })),
      );
    }),
  );
}
