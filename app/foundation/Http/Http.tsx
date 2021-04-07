import {ResponseHeader, CacheControl} from '@quilted/quilt/http';

export function Http() {
  return (
    <>
      {/** quilt should do this automatically... */}
      <ResponseHeader name="Content-Type" value="text/html" />
      <ResponseHeader name="X-Lemon" value="1" />
      <CacheControl cache={false} />
    </>
  );
}
