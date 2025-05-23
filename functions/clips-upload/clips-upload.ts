import type {R2Bucket} from '@cloudflare/workers-types';
import {JSONResponse, NoContentResponse} from '@quilted/request-router';

import {verifySignedToken} from '~/global/tokens.ts';

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
    return new NoContentResponse({
      headers: DEFAULT_HEADERS,
    });
  }

  if (request.method !== 'PUT') {
    return new JSONResponse(
      {error: 'You must call this API with a PUT method'},
      {
        status: 405,
        headers: DEFAULT_HEADERS,
      },
    );
  }

  const token = await request.text();

  try {
    const {
      data: {path, code},
    } = await verifySignedToken<{
      path?: string;
      code?: string;
    }>(token, {secret: env.JWT_SECRET});

    if (typeof path !== 'string' || typeof code !== 'string') {
      return new JSONResponse(
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

    return new JSONResponse({path}, {headers: DEFAULT_HEADERS});
  } catch (error) {
    return new JSONResponse(
      {error: 'Invalid token'},
      {
        status: 401,
        headers: DEFAULT_HEADERS,
      },
    );
  }
}

export default {fetch: handleRequest};
