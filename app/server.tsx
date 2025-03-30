import '@quilted/quilt/globals';
import {EnhancedRequest} from '@quilted/quilt/request-router';

import {Hono} from 'hono';

import {PrismaContext, type Environment} from './server/context.ts';
import {handleApp} from './server/app.tsx';
import auth from './server/auth.ts';
import graphql from './server/graphql.ts';
import {EnvironmentForRequest} from './server/environment.ts';

// Create Hono app
const app = new Hono<{Bindings: Environment}>();

// Add Prisma to the Hono context
app.use('*', async (c, next) => {
  c.set('prisma', new PrismaContext(c.env.DATABASE_URL));
  c.set('environment', new EnvironmentForRequest(c.req.raw));
  await next();
});

// Allows us to throw responses to short-circuit the request
app.use('*', async (c, next) => {
  try {
    await next();
  } catch (error) {
    if (error instanceof Response) c.res = error;
  }
});

app.route('/api/graphql', graphql);
app.route('/internal/auth', auth);
app.get('*', handleApp);

let exported: any = app;

if (process.env.NODE_ENV === 'development') {
  // Wrap this in a format that @quilted/request-router can handle
  exported = function fetch(request: EnhancedRequest) {
    return app.fetch(request, {...process.env});
  };
}

export default exported;
