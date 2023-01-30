import {createAsyncComponent} from '@quilted/quilt';
import {createServerRender} from '@quilted/quilt/server';
import {createAssetManifest} from '@quilted/quilt/magic/asset-manifest';

import {authenticate} from './shared/auth';

const App = createAsyncComponent(() => import('../App'));

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
    assets: createAssetManifest(),
  },
);

export default appHandler;
