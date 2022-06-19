const APP_HOST = 'watch-test-app.fly.dev';

interface CloudflareR2Bucket {
  get(key: string): any;
}

// TODO: caching
const handler: ExportedHandler<{
  APP_ASSETS: CloudflareR2Bucket;
  CLIPS_ASSETS: CloudflareR2Bucket;
}> = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const {pathname} = url;

    if (pathname.startsWith('/assets/app/')) {
      return assetFromBucket(url, env.APP_ASSETS);
    }

    if (pathname.startsWith('/assets/clips/')) {
      return assetFromBucket(url, env.CLIPS_ASSETS);
    }

    return rewriteAndFetch(request, (url) => {
      url.host = APP_HOST;
    });
  },
};

export default handler;

function rewriteAndFetch(request: Request, rewrite: (url: URL) => URL | void) {
  const url = new URL(request.url);
  const newUrl = rewrite(url) ?? url;

  const newRequest = new Request(newUrl.href, request);

  const originalUrl = new URL(request.url);
  newRequest.headers.set('X-Forwarded-Host', originalUrl.host);

  return fetch(newRequest);
}

// @see https://developers.cloudflare.com/r2/get-started/
async function assetFromBucket(url: URL, bucket: any) {
  const object = await bucket.get(url.pathname.slice(1));

  if (!object || !object.body) {
    return new Response('Not Found', {status: 404});
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);

  return new Response(object.body, {
    headers,
  });
}
