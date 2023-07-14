import type {EnhancedRequest} from '@quilted/quilt/server';

export async function handleAppleCallback(request: EnhancedRequest) {
  // eslint-disable-next-line no-console
  console.log(await request.json());
  return new Response(null, {status: 200});
}
