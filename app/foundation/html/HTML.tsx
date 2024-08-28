import type {RenderableProps} from 'preact';
import Env from 'quilt:module/env';
import {
  Title,
  Favicon,
  useBrowserRequest,
  ThemeColor,
} from '@quilted/quilt/browser';
import {
  CacheControl,
  ResponseHeader,
  ContentSecurityPolicy,
  PermissionsPolicy,
  SearchRobots,
  StrictTransportSecurity,
  Viewport,
} from '@quilted/quilt/server';

// This component sets details of the HTML page. If you need to customize
// any of these details based on conditions like the active route, or some
// state about the user, you can move these components to wherever in your
// application you can read that state.
//
// @see https://github.com/lemonmade/quilt/blob/main/documentation/features/html.md
export function HTML({children}: RenderableProps<{}>) {
  return (
    <>
      <Headers />
      <Head />
      {children}
    </>
  );
}

function Headers() {
  const {url} = useBrowserRequest();
  const isHttps = new URL(url).protocol === 'https:';
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
      {/*
       * Sets a strict permissions policy for this page, which limits access
       * to some native browser features.
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
       */}
      <PermissionsPolicy
        // Disables Google’s Federated Learning of Cohorts (“FLoC”) tracking initiative.
        // @see https://www.eff.org/deeplinks/2021/03/googles-floc-terrible-idea
        interestCohort={false}
        // Don’t use synchronous XHRs!
        // @see https://featurepolicy.info/policies/sync-xhr
        syncXhr={false}
        // Disables access to a few device APIs that are infrequently used
        // and prone to abuse. If your application uses these APIs intentionally,
        // feel free to remove the prop, or pass an array containing the origins
        // that should be allowed to use this feature (e.g., `['self']` to allow
        // only the main page’s origin).
        camera={false}
        microphone={false}
        geolocation={false}
      />

      {/*
       * Instructs browsers to only load this page over HTTPS using the
       * `Strict-Transport-Security` header.
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
       */}
      {isHttps && <StrictTransportSecurity />}

      {/*
       * Controls how much information about the current page is included in
       * requests (through the `Referer` header). The default value
       * (strict-origin-when-cross-origin) means that only the origin is included
       * for cross-origin requests, while the origin, path, and querystring
       * are included for same-origin requests.
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
       */}
      <ResponseHeader
        name="Referrer-Policy"
        value="strict-origin-when-cross-origin"
      />

      {/*
       * Instructs browsers to respect the MIME type in the `Content-Type` header.
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
       */}
      <ResponseHeader name="X-Content-Type-Options" value="nosniff" />
    </>
  );
}

function Head() {
  return (
    <>
      <Title>Watch</Title>
      <Viewport cover />
      <Favicon emoji="📺" />
      <ThemeColor value="rgb(26, 21, 34)" />

      {/*
       * Disables all search indexing for this application. If you are
       * building an unauthenticated app, you probably want to remove
       * this component, or update it to control how your site is indexed
       * by search engines.
       */}
      <SearchRobots index={false} follow={false} />
    </>
  );
}
