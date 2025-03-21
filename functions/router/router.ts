import {RequestRouter, type RequestHandler} from '@quilted/request-router';
import type {
  KVNamespace,
  R2Bucket,
  Fetcher,
  Service,
  Rpc,
  DispatchNamespace,
} from '@cloudflare/workers-types';
import type {CloudflareRequestContext} from '@quilted/cloudflare';

import {PREVIEW_HEADER} from '~/global/preview.ts';

import type {EmailService} from '../email';

interface Environment {
  APP_ASSETS: R2Bucket;
  CLIPS_ASSETS: R2Bucket;
  SERVICE_APP: Fetcher;
  SERVICE_UPLOAD_CLIPS: Fetcher;
  SERVICE_EMAIL: Service<EmailService & Rpc.WorkerEntrypointBranded>;
  SERVICE_STRIPE: Fetcher;
  SERVICE_TMDB_REFRESHER: Fetcher;
  SERVICE_METRICS: Fetcher;
  SERVICE_IMAGES: Fetcher;
  PERSISTED_QUERIES: KVNamespace;
  WATCH_PREVIEWS: DispatchNamespace;
}

declare module '@quilted/cloudflare' {
  interface CloudflareRequestEnvironment extends Environment {}
}

// TODO: caching
const router = new RequestRouter<CloudflareRequestContext>();

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
  'internal/tmdb/refresh',
  (request, {env}) =>
    env.SERVICE_TMDB_REFRESHER.fetch(
      new URL('/', request.url),
      request as any,
    ) as any,
);

router.any(
  'internal/email/queue',
  (request, {env}) =>
    env.SERVICE_EMAIL.fetch(new URL('/', request.url), request as any) as any,
);

const handleGraphQLRequest: RequestHandler<CloudflareRequestContext> = async (
  request,
  {env},
) => {
  const {searchParams} = request.URL;

  let source: string | undefined;
  const id = searchParams.get('id');

  if (id) {
    const {default: manifest} = await import('watch:module/graphql-manifest');
    source = manifest[id] ?? (await env.PERSISTED_QUERIES.get(id)) ?? undefined;
  }

  let resolvedRequest: Request = request;

  if (source != null) {
    if (request.method === 'GET') {
      const variables = searchParams.get('variables');
      const extensions = searchParams.get('extensions');
      const operationName =
        searchParams.get('name') ??
        searchParams.get('operationName') ??
        searchParams.get('operation-name') ??
        undefined;

      resolvedRequest = new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        keepalive: request.keepalive,
        body: JSON.stringify({
          operation: source,
          name: operationName,
          variables: variables ? JSON.parse(variables) : undefined,
          extensions: extensions ? JSON.parse(extensions) : undefined,
        }),
      });
    } else {
      const body = (await request.json()) as any;

      resolvedRequest = new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        keepalive: request.keepalive,
        body: JSON.stringify({
          query: source,
          ...body,
        }),
      });
    }
  }

  return respondFromApp(resolvedRequest, {env});
};

router.get('api/graphql', handleGraphQLRequest);
router.post('api/graphql', handleGraphQLRequest);

router.any((request, {env}) => respondFromApp(request, {env}));

export default router;

function respondFromApp(request: Request, {env}: {env: Environment}) {
  const previewCommit = request.headers.get(PREVIEW_HEADER);

  if (previewCommit) {
    const previewWorker = env.WATCH_PREVIEWS.get(`app.${previewCommit}`);
    return previewWorker.fetch(request as any) as any as Promise<Response>;
  }

  return env.SERVICE_APP.fetch(request as any) as any as Promise<Response>;
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
