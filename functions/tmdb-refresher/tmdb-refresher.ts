import {Buffer} from 'buffer-polyfill';

import type {ExportedHandlerQueueHandler} from '@cloudflare/workers-types';

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

const handleFetch = async function handleFetch(
  request: Request,
  env: Environment,
) {
  if (request.method !== 'POST') {
    // response with method not allowed status
    return new Response(
      JSON.stringify({
        error: {message: 'You can only use HTTP POST for this request.'},
      }),
      {
        status: 405,
        headers: {
          Allow: 'POST',
          'Content-Type': 'application/json',
        },
      },
    );
  }

  const token = request.headers.get('TMDB-Access-Token');

  if (token !== env.TMDB_ACCESS_TOKEN) {
    return new Response(
      JSON.stringify({
        error: {
          message:
            'You must provide the TMDB token in the TMDB-Access-Token header of the request.',
        },
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  try {
    const options = (await request.json()) as {
      id?: string | number;
      handle?: string;
    };
    const idOption = options.id ? String(options.id) : undefined;
    const handleOption = options.handle;

    if (typeof idOption !== 'string' && typeof handleOption !== 'string') {
      return new Response(
        JSON.stringify({
          error: {
            message:
              'You must provide either an `id` or `handle` option in your JSON request body.',
          },
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const prisma = await createPrisma(env.DATABASE_URL);
    const {id, name, tmdbId} = await prisma.series.findFirstOrThrow({
      where: idOption ? {id: idOption} : {handle: handleOption},
      select: {id: true, name: true, tmdbId: true},
    });

    const {results} = await updateSeries({
      id,
      name,
      tmdbId,
      prisma,
      accessToken: env.TMDB_ACCESS_TOKEN,
    });

    const result = results.join('\n\n');
    console.log(result);

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        error: {
          message: 'There was an error while updating series.',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
};

const handleQueue: ExportedHandlerQueueHandler<Environment, Message> =
  async function handleQueue(batch, env) {
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
  };

export default {fetch: handleFetch, queue: handleQueue};

let prismaPromise:
  | Promise<import('@prisma/client/edge').PrismaClient>
  | undefined;

async function createPrisma(url: string) {
  prismaPromise ??= (async () => {
    const [{PrismaClient}, {withAccelerate}] = await Promise.all([
      import('@prisma/client/edge'),
      import('@prisma/extension-accelerate'),
    ]);

    const prisma = new PrismaClient({
      datasources: {
        db: {url},
      },
    }).$extends(withAccelerate());

    return prisma as any;
  })();

  return await prismaPromise;
}
