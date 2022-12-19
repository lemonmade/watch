import type {R2Bucket, Fetcher} from '@cloudflare/workers-types';

const APP_HOST = 'watch-test-app.fly.dev';

interface Environment {
  APP_ASSETS: R2Bucket;
  CLIPS_ASSETS: R2Bucket;
  SERVICE_UPLOAD_CLIPS: Fetcher;
  SERVICE_EMAIL_QUEUE: Fetcher;
}

// TODO: caching
async function handleRequest(request: Request, env: Environment) {
  const url = new URL(request.url);
  const {pathname} = url;

  if (pathname.startsWith('/assets/app/')) {
    return assetFromBucket(url, env.APP_ASSETS);
  }

  if (pathname.startsWith('/assets/clips/')) {
    return assetFromBucket(url, env.CLIPS_ASSETS);
  }

  if (pathname === '/internal/upload/clips') {
    return env.SERVICE_UPLOAD_CLIPS.fetch(new URL('/', url), request as any);
  }

  if (pathname === '/internal/email/queue') {
    return env.SERVICE_EMAIL_QUEUE.fetch(new URL('/', url), request as any);
  }

  return rewriteAndFetch(request, (url) => {
    url.host = APP_HOST;
  });
}

export default {fetch: handleRequest};

function rewriteAndFetch(request: Request, rewrite: (url: URL) => URL | void) {
  const url = new URL(request.url);
  const newUrl = rewrite(url) ?? url;

  const newRequest = new Request(newUrl.href, request);

  const originalUrl = new URL(request.url);
  newRequest.headers.set('X-Forwarded-Host', originalUrl.host);

  return fetch(newRequest);
}

// @see https://developers.cloudflare.com/r2/get-started/
async function assetFromBucket(url: URL, bucket: R2Bucket) {
  const object = await bucket.get(url.pathname.slice(1));

  if (!object || !object.body) {
    return new Response('Not Found', {status: 404});
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers as any);
  headers.set('etag', object.httpEtag);

  return new Response(object.body as any, {
    headers,
  });
}
