import Env from 'quilt:module/env';
import {
  CacheControl,
  ResponseHeader,
  ContentSecurityPolicy,
} from '@quilted/quilt/http';

export function Http() {
  const isDevelopment = Env.MODE === 'development';

  return (
    <>
      <CacheControl cache={false} />
      <ContentSecurityPolicy
        reportOnly={isDevelopment}
        defaultSources={["'self'"]}
        // Allow localhost and any HTTP script for connecting to local development servers
        scriptSources={["'self'", 'http://localhost:*', 'https://*']}
        // We inject style tags into the page, so we need unsafe-inline
        styleSources={["'self'", "'unsafe-inline'"]}
        // data: needed for the favicon
        // production URL used in development to get smaller images
        imageSources={[
          "'self'",
          'data:',
          'https://image.tmdb.org',
          ...(Env.MODE === 'development' ? ['https://watch.lemon.tools'] : []),
        ]}
        // blob: needed for the Quilt worker libraries; Safari does not
        // support worker-src, so we need to set child-src for it.
        childSources={["'self'", 'blob:']}
        frameSources={["'self'", 'https://js.stripe.com']}
        workerSources={["'self'", 'blob:']}
        // Allow a wide array of connection URLs to allow for local development
        // of extensions.
        connectSources={[
          "'self'",
          'http://localhost:*',
          'https://*',
          'ws://localhost:*',
          'wss://*',
        ]}
        frameAncestors={false}
        upgradeInsecureRequests={!isDevelopment}
      />
      {/**
       * Disables Google’s Federated Learning of Cohorts (“FLoC”)
       * tracking initiative.
       *
       * @see https://www.eff.org/deeplinks/2021/03/googles-floc-terrible-idea
       */}
      <ResponseHeader name="Permissions-Policy" value="interest-cohort=()" />
    </>
  );
}
