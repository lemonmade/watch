import type {App} from '@lemon/tiny-server';
import type {APIGatewayProxyHandlerV2} from 'aws-lambda';

export function createLambdaApiGatewayProxy(
  app: App,
): APIGatewayProxyHandlerV2 {
  return async (event) => {
    const headers = new Headers(event.headers as Record<string, string>);

    const response = await app.run({
      headers,
      method: event.requestContext.http.method,
      body: event.body,
      url: new URL(
        `${headers.get('X-Forwarded-Proto') ?? 'https'}://${
          headers.get('X-Forwarded-Host') ?? event.requestContext.domainName
        }${event.rawPath}${
          event.rawQueryString ? `?${event.rawQueryString}` : ''
        }`,
      ),
      cookies: {
        get: () => undefined,
      },
    });

    return {
      statusCode: response.status,
      body: await response.text(),
      headers: [...response.headers].reduce<Record<string, string>>(
        (allHeaders, [header, value]) => {
          allHeaders[header] = value;
          return allHeaders;
        },
        {},
      ),
    };
  };
}
