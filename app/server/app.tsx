import {createAsyncComponent} from '@quilted/quilt';
import {createServerRender} from '@quilted/quilt/server';
import {createBrowserAssets} from '@quilted/quilt/magic/assets';

import {authenticate} from './shared/auth.ts';

const App = createAsyncComponent(() => import('../App.tsx'));

const appHandler = createServerRender(
  async (request) => {
    const [authentication] = await Promise.all([authenticate(request)]);

    const user = authentication.user
      ? {
          ...authentication.user,
          id: `gid://watch/User/${authentication.user.id}`,
        }
      : undefined;

    return <App user={user} />;
  },
  {
    assets: createBrowserAssets(),
  },
);

export default appHandler;
