import type {ScheduledEvent} from '@cloudflare/workers-types';
import {createPrisma, type Environment} from './shared';

export async function handleScheduled(event: ScheduledEvent, env: Environment) {
  console.log('Scheduled event:');
  console.log(JSON.stringify(event, null, 2));

  const prisma = await createPrisma(env.DATABASE_URL);

  const series = await prisma.series.findMany({
    where: {status: 'RETURNING'},
  });

  console.log('Queuing updates to returning series:');
  console.log(
    series
      .map((series) => `${series.name} (tmdbId: ${series.tmdbId})`)
      .join('\n'),
  );

  await env.TMDB_REFRESHER_QUEUE.sendBatch(
    series.map((series) => ({
      body: {
        id: series.id,
        name: series.name,
        tmdbId: series.tmdbId,
      },
    })),
  );
}
