import {EnhancedRequest} from '@quilted/quilt/request-router';
import type {Context, Handler} from 'hono';

export function createResponseHandler(
  callback: (
    request: EnhancedRequest,
    context: Context,
  ) => Response | undefined | Promise<Response | undefined>,
): Handler {
  return async (c) => {
    const request = new EnhancedRequest(c.req.raw);
    const response = await callback(request, c);
    return response;
  };
}
