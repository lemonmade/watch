import type {CloudFrontResponseHandler} from 'aws-lambda';

const REMOVE_HEADERS = new Set(['x-cache', 'server', 'via']);
const REMOVE_HEADER_REGEX = /^(x-amz|apigw-)/i;

export const headerCleanup: CloudFrontResponseHandler = (
  event,
  _,
  callback,
) => {
  // eslint-disable-next-line no-console
  console.log(event);

  const {response} = event.Records[0].cf;
  const {headers} = response;

  const newHeaders: typeof headers = {
    'timing-allow-origin': [{key: 'Timing-Allow-Origin', value: '*'}],
  };

  for (const [header, value] of Object.entries(headers)) {
    if (REMOVE_HEADERS.has(header) || REMOVE_HEADER_REGEX.test(header)) {
      continue;
    }

    newHeaders[header] = value;
  }

  callback(null, {...response, headers: newHeaders});
};
