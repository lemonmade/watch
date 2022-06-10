// const APP_HOST = 'watch-test-app.fly.dev';
const APP_ASSETS_HOST = 'watch-assets-app.s3.us-east-1.amazonaws.com';
const CLIPS_ASSETS_HOST = 'watch-assets-clips.s3.us-east-1.amazonaws.com';

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

    return fetch(request);
  },
};

export default handler;

function rewriteAndFetch(request: Request, rewrite: (url: URL) => URL | void) {
  const url = new URL(request.url);
  const newUrl = rewrite(url) ?? url;

  const newRequest = new Request(newUrl.href, request);

  return fetch(newRequest);
}
