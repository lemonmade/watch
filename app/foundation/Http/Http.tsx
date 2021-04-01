import {useResponseHeader} from '@quilted/quilt/http';

export function Http() {
  useResponseHeader('Content-Type', 'text/html');
  useResponseHeader('X-Lemon', '1');
  useResponseHeader('Cache-Control', 'no-cache');

  return null;
}
