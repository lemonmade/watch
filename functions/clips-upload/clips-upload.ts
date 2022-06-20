import type {} from '@quilted/cloudflare/http-handlers';
import {createHttpHandler, json} from '@quilted/quilt/http-handlers';
import jwt from '@tsndr/cloudflare-worker-jwt';

const handler = createHttpHandler();

handler.any('/', async (request, context) => {
  if (request.method !== 'PUT') {
    return json(
      {error: 'You must call this API with a PUT method'},
      {
        status: 405,
        headers: {
          Allow: 'PUT',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'PUT',
        },
      },
    );
  }

  const token = request.body ?? '';
  const valid = await jwt.verify(token, context.env.JWT_SECRET);

  if (!valid) {
    return json(
      {error: 'Invalid token'},
      {
        status: 401,
        headers: {
          Allow: 'PUT',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'PUT',
        },
      },
    );
  }

  const {path, code} = jwt.decode(token).payload as {
    path?: string;
    code?: string;
  };

  if (typeof path !== 'string' || typeof code !== 'string') {
    return json(
      {
        error:
          'You must call this API with a token that contains `path` and `code` properties',
      },
      {
        status: 400,
        headers: {
          Allow: 'PUT',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'PUT',
        },
      },
    );
  }

  await context.env.CLIPS_ASSETS.put(path, code);

  return json(
    {path},
    {
      headers: {
        Allow: 'PUT',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT',
      },
    },
  );
});

export default handler;
