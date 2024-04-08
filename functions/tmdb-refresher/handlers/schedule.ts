import type {ScheduledEvent} from '@cloudflare/workers-types';
import {createPrisma, type Environment} from './shared';

export async function handleScheduled(event: ScheduledEvent, env: Environment) {
  console.log(JSON.stringify(event, null, 2));

  try {
    const prisma = await createPrisma(env.DATABASE_URL);

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
}
