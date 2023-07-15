import {createRequestRouter} from '@quilted/request-router';
import type {R2Bucket, Fetcher} from '@cloudflare/workers-types';
import type {CloudflareRequestContext} from '@quilted/cloudflare';

const APP_HOST = 'watch-test-app.fly.dev';

interface Environment {
  APP_ASSETS: R2Bucket;
  CLIPS_ASSETS: R2Bucket;
  SERVICE_UPLOAD_CLIPS: Fetcher;
  SERVICE_EMAIL: Fetcher;
  SERVICE_STRIPE: Fetcher;
  SERVICE_METRICS: Fetcher;
  SERVICE_IMAGES: Fetcher;
}

declare module '@quilted/cloudflare' {
  interface CloudflareRequestEnvironment extends Environment {}
}

// TODO: caching
const router = createRequestRouter<CloudflareRequestContext>();

router.any(
  'assets/app',
  (request, {env}) => assetFromBucket(request.URL, env.APP_ASSETS),
  {exact: false},
);

router.any(
  'assets/clips',
  (request, {env}) => assetFromBucket(request.URL, env.CLIPS_ASSETS),
  {exact: false},
);

router.any(
  'assets/images',
  (request, {env}) => {
    const newUrl = new URL(request.url);
    newUrl.pathname = newUrl.pathname.replace('/assets/images', '');
    return env.SERVICE_IMAGES.fetch(newUrl, request as any) as any;
  },
  {exact: false},
);

router.any(
  'internal/metrics',
  (request, {env}) => env.SERVICE_METRICS.fetch(request as any) as any,
  {exact: false},
);

router.any(
  'internal/stripe',
  (request, {env}) => env.SERVICE_STRIPE.fetch(request as any) as any,
  {exact: false},
);

router.any(
  'internal/upload/clips',
  (request, {env}) =>
    env.SERVICE_UPLOAD_CLIPS.fetch(
      new URL('/', request.url),
      request as any,
    ) as any,
);

router.any(
  'internal/email/queue',
  (request, {env}) =>
    env.SERVICE_EMAIL.fetch(new URL('/', request.url), request as any) as any,
);

router.any((request) => {
  return rewriteAndFetch(request, (url) => {
    url.host = APP_HOST;
  });
});

export default router;

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
