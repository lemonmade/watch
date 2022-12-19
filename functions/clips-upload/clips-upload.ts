import type {R2Bucket} from '@cloudflare/workers-types';
import {json, noContent} from '@quilted/http-handlers';
import jwt from '@tsndr/cloudflare-worker-jwt';

interface Environment {
  JWT_SECRET: string;
  CLIPS_ASSETS: R2Bucket;
}

const DEFAULT_HEADERS = {
  Allow: 'PUT',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT',
  'Timing-Allow-Origin': '*',
};

async function handleRequest(request: Request, env: Environment) {
  if (request.method === 'OPTIONS') {
    return noContent({
      headers: DEFAULT_HEADERS,
    });
  }

  if (request.method !== 'PUT') {
    return json(
      {error: 'You must call this API with a PUT method'},
      {
        status: 405,
        headers: DEFAULT_HEADERS,
      },
    );
  }

  const token = await request.text();
  const valid = await jwt.verify(token, env.JWT_SECRET);

  if (!valid) {
    return json(
      {error: 'Invalid token'},
      {
        status: 401,
        headers: DEFAULT_HEADERS,
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
        headers: DEFAULT_HEADERS,
      },
    );
  }

  await env.CLIPS_ASSETS.put(path, code, {
    httpMetadata: {
      contentType: 'text/javascript',
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

  return json({path}, {headers: DEFAULT_HEADERS});
}

export default {fetch: handleRequest};
