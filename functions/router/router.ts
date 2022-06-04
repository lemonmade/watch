const APP_HOST = 'watch-test-app.fly.dev';
const APP_ASSETS_HOST = 'watch-assets-app.s3.us-east-1.amazonaws.com';

const handler: ExportedHandler = {
  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/assets/app/')) {
      return fetch(rewriteUrl(url, {host: APP_ASSETS_HOST}), request);
    }

    return fetch(rewriteUrl(url, {host: APP_HOST}), request);
  },
};

export default handler;

function rewriteUrl(url: URL, {host}: {host: string}) {
  const newUrl = new URL(url);
  newUrl.host = host;
  return newUrl.href;
}
