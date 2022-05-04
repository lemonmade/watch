import Env from '@quilted/quilt/env';
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
        // Allow localhost for connecting to local development servers
        scriptSources={["'self'", 'http://localhost:*']}
        // We inject style tags into the page, so we need unsafe-inline
        styleSources={["'self'", "'unsafe-inline'"]}
        // data: needed for the favicon
        imageSources={["'self'", 'data:', 'https://image.tmdb.org']}
        // blob: needed for the Quilt worker libraries; Safari does not
        // support worker-src, so we need to set child-src for it.
        childSources={["'self'", 'blob:']}
        workerSources={["'self'", 'blob:']}
        // Allow localhost for connecting to local development servers
        connectSources={["'self'", 'http://localhost:*', 'ws://localhost:*']}
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
