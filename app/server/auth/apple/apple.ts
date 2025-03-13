import {createResponseHandler} from '../../shared/response.ts';

export const handleAppleCallback = createResponseHandler(
  async function handleAppleCallback(request) {
    console.log(await request.json());
    return new Response(null, {status: 200});
  },
);
