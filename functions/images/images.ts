import type {
  RequestInitCfPropertiesImage,
  ExportedHandlerFetchHandler,
  fetch as CloudflareFetch,
} from '@cloudflare/workers-types';

const PRESERVE_HEADERS = new Set(
  [
    'Cache-Control',
    'Content-Type',
    'Content-Length',
    'Age',
    'ETag',
    'Last-Modified',
  ].map((header) => header.toLowerCase()),
);

// @see https://developers.cloudflare.com/images/image-resizing/resize-with-workers/#an-example-worker
const handleFetch: ExportedHandlerFetchHandler = async function handleRequest(
  request,
) {
  const url = new URL(request.url);
  const accept = request.headers.get('Accept') ?? '';

  const image: RequestInitCfPropertiesImage = {
    fit: 'cover',
  };

  if (/image\/avif/.test(accept)) {
    image.format = 'avif';
  } else if (/image\/webp/.test(accept)) {
    image.format = 'webp';
  }

  const width = url.searchParams.get('width');
  if (width) image.width = Number.parseInt(width, 10);

  const height = url.searchParams.get('height');
  if (height) image.height = Number.parseInt(height, 10);

  const tmdbResponse = await (fetch as any as typeof CloudflareFetch)(
    `https://image.tmdb.org/t/p/original${url.pathname}`,
    {
      cf: {image},
      headers: request.headers,
    },
  );

  const response = new Response(tmdbResponse.body as any, tmdbResponse);

  for (const header of response.headers.keys()) {
    if (!PRESERVE_HEADERS.has(header.toLowerCase())) {
      response.headers.delete(header);
    }
  }

  return response as any;
};

export default {fetch: handleFetch};
