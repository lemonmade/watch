import '@quilted/quilt/global';
import {
  createHttpHandler,
  createServerRenderingRequestHandler,
} from '@quilted/quilt/server';
import createAssetManifest from '@quilted/quilt/magic/app/asset-manifest';

import graphqlHandler from './server/graphql';
import authHandler from './server/auth';

const httpHandler = createHttpHandler();

httpHandler.any('/api/graphql', graphqlHandler);
httpHandler.any('/internal/auth', authHandler);

// For all GET requests, render our React application.
httpHandler.get(
  createServerRenderingRequestHandler(
    async () => {
      const {default: App} = await import('./App');
      return <App />;
    },
    {
      assets: createAssetManifest(),
    },
  ),
);

export default httpHandler;