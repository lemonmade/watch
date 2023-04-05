/* eslint no-console: off */

import {Buffer} from 'buffer-polyfill';

import {type ExportedHandlerQueueHandler} from '@cloudflare/workers-types';

import {updateSeries} from '~/global/tmdb.ts';

interface Environment {
  DATABASE_URL: string;
  TMDB_ACCESS_TOKEN: string;
}

export interface Message {
  id: string;
  name: string;
  tmdbId: string;
}

// Need this for Prisma...
Reflect.defineProperty(globalThis, 'Buffer', {value: Buffer});

const queue: ExportedHandlerQueueHandler<Environment, Message> =
  async function queue(batch, env) {
    const {PrismaClient} = await import('@prisma/client/edge');

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: env.DATABASE_URL,
        },
      },
    });

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
  };

export default {queue};
