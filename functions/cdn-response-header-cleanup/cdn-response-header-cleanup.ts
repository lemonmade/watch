import type {CloudFrontResponseHandler} from 'aws-lambda';

// We remove a few headers that the world doesn’t need to see...
const REMOVE_HEADERS = new Set(['x-cache', 'server', 'via']);

// And we DEFINITELY remove all the garbage headers AWS adds.
const REMOVE_HEADER_REGEX = /^(x-amz|apigw-)/i;

// This handler runs at the edge. It adds headers that allow reading
// performance timing details on all requests across origins, and removes
// some headers we don’t care for.
export const handler: CloudFrontResponseHandler = (event, _, callback) => {
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
