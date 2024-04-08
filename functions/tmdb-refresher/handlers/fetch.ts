import {updateSeries} from '~/global/tmdb.ts';
import {createPrisma, type Environment} from './shared.ts';

export async function handleFetch(request: Request, env: Environment) {
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
    const {id, name, tmdbId} = await prisma.series.findUniqueOrThrow({
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
}
