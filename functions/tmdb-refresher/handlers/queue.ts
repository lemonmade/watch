import {updateSeries} from '~/global/tmdb.ts';
import {createPrisma, type Environment, type Message} from './shared.ts';
import type {MessageBatch} from '@cloudflare/workers-types';

export async function handleQueue(
  batch: MessageBatch<Message>,
  env: Environment,
) {
  const prisma = await createPrisma(env.DATABASE_URL);

  try {
    await Promise.all(
      batch.messages.map(async ({body: {id, name, tmdbId}}) => {
        const {results} = await updateSeries({
          id,
          name,
          tmdbId,
          prisma,
          accessToken: env.TMDB_ACCESS_TOKEN,
        });

        const result = results.join('\n\n');
        console.log(result);

        const fetchResult = await fetch(
          'https://discordapp.com/api/webhooks/656640833063223325/1ofugrkDFpqaSAWvD6mLlg5EN3UDOfBdib4WKNE17Q5YxUoz8wpwuLoKCeaZJqCHyfeC',
          {
            method: 'POST',
            body: JSON.stringify({
              content: result,
            }),
            headers: {'Content-Type': 'application/json'},
          },
        );

        console.log(fetchResult);
      }),
    );
  } catch (error) {
    console.log((error as any)?.stack);
    throw error;
  }
}
