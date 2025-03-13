import type {MessageBatch} from '@cloudflare/workers-types';

import {updateSeries} from '~/global/tmdb.ts';
import {createEdgeDatabaseConnection} from '~/global/database.ts';

import type {Environment, Message} from './shared.ts';

export async function handleQueue(
  batch: MessageBatch<Message>,
  env: Environment,
) {
  console.log('Handling updates to returning series:');
  console.log(
    batch.messages
      .map(({body}) => `${body.name} (tmdbId: ${body.tmdbId})`)
      .join('\n'),
  );

  const prisma = await createEdgeDatabaseConnection({url: env.DATABASE_URL});

  await Promise.all(
    batch.messages.map(async ({body: {id, name, tmdbId}}) => {
      const {results} = await updateSeries({
        id,
        name,
        tmdbId,
        prisma,
        accessToken: env.TMDB_ACCESS_TOKEN,
      });

      console.log('Update results:');
      console.log(results);

      const fetchResult = await fetch(
        'https://discordapp.com/api/webhooks/656640833063223325/1ofugrkDFpqaSAWvD6mLlg5EN3UDOfBdib4WKNE17Q5YxUoz8wpwuLoKCeaZJqCHyfeC',
        {
          method: 'POST',
          body: JSON.stringify({
            content: results.join('\n\n'),
          }),
          headers: {'Content-Type': 'application/json'},
        },
      );

      console.log('Discord fetch result:');
      console.log(fetchResult);
    }),
  );
}
