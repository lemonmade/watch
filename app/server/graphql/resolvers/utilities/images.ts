import Env from '@quilted/quilt/env';

const BASE_URL = 'https://image.tmdb.org/t/p/original/';

export function imageUrl(
  source: string,
  options?: {width?: number; height?: number},
) {
  if (!source.startsWith(BASE_URL)) {
    return source;
  }

  const path = `${
    Env.MODE === 'development' ? 'https://watch.lemon.tools' : ''
  }/assets/images/${source.slice(BASE_URL.length)}`;

  if (!options) return path;

  const searchParams = new URLSearchParams();
  const {width, height} = options;

  if (width) searchParams.set('width', String(width));
  if (height) searchParams.set('height', String(height));

  return `${path}?${searchParams.toString()}`;
}
