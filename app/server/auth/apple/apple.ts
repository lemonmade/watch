import type {EnhancedRequest} from '@quilted/quilt/request-router';

export async function handleAppleCallback(request: EnhancedRequest) {
  console.log(await request.json());
  return new Response(null, {status: 200});
}
