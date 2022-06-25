import type {} from '@quilted/cloudflare/http-handlers';
import {createHttpHandler, json} from '@quilted/quilt/http-handlers';
import jwt from '@tsndr/cloudflare-worker-jwt';

const handler = createHttpHandler();

handler.put(async (request, context) => {
  const token = await request.text();
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

  const bucket: R2Bucket = context.env.CLIPS_ASSETS;

  await bucket.put(path, code, {
    httpMetadata: {
      contentType: 'text/javascript',
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

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

handler.any(() =>
  json(
    {error: 'You must call this API with a PUT method'},
    {
      status: 405,
      headers: {
        Allow: 'PUT',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT',
      },
    },
  ),
);

export default handler;
