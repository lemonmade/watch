import {ResponseHeader} from '@quilted/quilt/http';

export function Http() {
  return (
    <>
      <ResponseHeader header="Content-Type" value="text/html" />
      <ResponseHeader header="Cache-Control" value="no-cache" />
      <ResponseHeader header="X-Lemon" value="1" />
    </>
  );
}
