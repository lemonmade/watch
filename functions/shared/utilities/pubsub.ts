import {createHttpHandler, noContent} from '@quilted/http-handlers';
import type {RequestHandler, HttpHandler} from '@quilted/http-handlers';

export type {RequestHandler, HttpHandler};

export interface PubSubRequestHandler<Message> {
  (message: Message, ...args: Parameters<RequestHandler>): void | Promise<void>;
}

export function createPubSubHandler<Message = unknown>(
  handleRequest: PubSubRequestHandler<Message>,
): HttpHandler {
  const handler = createHttpHandler();

  handler.post('/', async (request, context) => {
    const body = JSON.parse(request.body!);
    const message = JSON.parse(
      Buffer.from(body.message.data, 'base64').toString().trim(),
    );

    /* eslint-disable no-console */
    console.log('Request body:');
    console.log(body);

    console.log('PubSub message:');
    console.log(message);
    /* eslint-enable no-console */

    await handleRequest(message, request, context);

    return noContent();
  });

  return handler;
}
