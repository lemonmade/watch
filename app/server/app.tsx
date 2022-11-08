import {createServerRenderingRequestHandler} from '@quilted/quilt/server';
import createAssetManifest from '@quilted/quilt/magic/app/asset-manifest';

import {authenticate} from './shared/auth';

const appHandler = createServerRenderingRequestHandler(
  async (request) => {
    const [{default: App}, authentication] = await Promise.all([
      import('../App'),
      authenticate(request),
    ]);

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
