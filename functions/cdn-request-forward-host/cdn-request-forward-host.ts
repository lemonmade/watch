import type {CloudFrontRequestHandler} from 'aws-lambda';

// We copy the `host` header to `x-forwarded-host` (and allow that header in
// our Cloudfront origin config) because otherwise we lose the actual host
// in the application functions.
export const handler: CloudFrontRequestHandler = (event, _, callback) => {
  const {request} = event.Records[0]!.cf;

  callback(null, {
    ...request,
    headers: {
      ...request.headers,
      'x-forwarded-host': [{value: request.headers.host![0]!.value}],
    },
  });
};
