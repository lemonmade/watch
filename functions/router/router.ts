const APP_HOST = 'watch-test-app.fly.dev';
const APP_ASSETS_HOST = 'watch-assets-app.s3.us-east-1.amazonaws.com';
const CLIPS_ASSETS_HOST = 'watch-assets-clips.s3.us-east-1.amazonaws.com';
const GRAPHQL_API_HOST = 'watch-graphql-api.fly.dev';
const INTERNAL_AUTH_HOST = 'watch-internal-auth.fly.dev';

// TODO: caching
const handler: ExportedHandler = {
  async fetch(request: Request) {
    const url = new URL(request.url);
    const {pathname} = url;

    if (pathname.startsWith('/assets/app/')) {
      return rewriteAndFetch(request, (url) => {
        url.host = APP_ASSETS_HOST;
      });
    }

    if (pathname.startsWith('/assets/clips/')) {
      return rewriteAndFetch(request, (url) => {
        url.host = CLIPS_ASSETS_HOST;
      });
    }

    if (pathname === '/api/graphql') {
      return rewriteAndFetch(request, (url) => {
        url.host = GRAPHQL_API_HOST;
      });
    }

    if (pathname.startsWith('/internal/auth/')) {
      return rewriteAndFetch(request, (url) => {
        url.host = INTERNAL_AUTH_HOST;
      });
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

  newRequest.headers.set('X-Forwarded-Host', newUrl.host);

  return fetch(newRequest);
}
