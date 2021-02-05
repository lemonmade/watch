import type {CloudFrontResponseHandler} from 'aws-lambda';

export const assetsHeaderRewrite: CloudFrontResponseHandler = (
  event,
  _,
  callback,
) => {
  const {response} = event.Records[0].cf;
  const {headers} = response;
  const originalHeader = 'x-amz-meta-timing-allow-origin';

  if (headers[originalHeader]) {
    const newHeaders = {...headers};

    newHeaders['timing-allow-origin'] = headers[originalHeader].map((entry) => {
      return {
        ...entry,
        key: 'Timing-Allow-Origin',
      };
    });

    delete newHeaders[originalHeader];

    callback(null, {...response, headers: newHeaders});
    return;
  }

  callback(null, response);
};
