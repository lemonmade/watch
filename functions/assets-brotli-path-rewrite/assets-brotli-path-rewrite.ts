import type {CloudFrontRequestHandler} from 'aws-lambda';

const EXTENSIONS_SUPPORTING_BROTLI = new Set(['css', 'js']);

export const assetsBrotliPathRewrite: CloudFrontRequestHandler = (
  event,
  _,
  callback,
) => {
  const {request} = event.Records[0].cf;
  const {headers, uri} = request;

  let normalizedUri = uri;

  if (supportsBrotli(request.uri) && headers['accept-encoding']) {
    for (const header of headers['accept-encoding']) {
      if (header.value.includes('br')) {
        normalizedUri = `${normalizedUri}.br`;
        break;
      }
    }
  }

  callback(null, {...request, uri: normalizedUri});
};

export default assetsBrotliPathRewrite;

function supportsBrotli(uri: string) {
  const extension = uri.split('.').pop();
  return extension != null && EXTENSIONS_SUPPORTING_BROTLI.has(extension);
}
