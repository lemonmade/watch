import {createAsyncComponent} from '@quilted/quilt/async';
import {renderToResponse} from '@quilted/quilt/server';
import {RequestHandler} from '@quilted/quilt/request-router';
import {BrowserAssets} from '@quilted/quilt/magic/assets';

import {authenticate} from './shared/auth.ts';

const App = createAsyncComponent(() => import('../App.tsx'));

const assets = new BrowserAssets();

export const handleApp: RequestHandler = async function handleApp(request) {
  if (request.method !== 'GET') {
    return new Response(null, {status: 405, headers: {Allow: 'GET'}});
  }

  const [authentication] = await Promise.all([authenticate(request)]);

  const user = authentication.user
    ? {
        ...authentication.user,
        id: `gid://watch/User/${authentication.user.id}`,
      }
    : undefined;

  const response = await renderToResponse(<App user={user} />, {
    assets,
    request,
  });

  return response;
};
