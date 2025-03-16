import '@quilted/quilt/globals';
import {EnhancedRequest} from '@quilted/quilt/request-router';

import {Hono} from 'hono';

import {PrismaContext, type Environment} from './server/context.ts';
import {handleApp} from './server/app.tsx';
import auth from './server/auth.ts';
import graphql from './server/graphql.ts';

// Create Hono app
const app = new Hono<{Bindings: Environment}>();

// Add Prisma to the Hono context
app.use('*', async (c, next) => {
  c.set('prisma', new PrismaContext(c.env.DATABASE_URL));
  await next();
});

app.route('/api/graphql', graphql);
app.route('/internal/auth', auth);
app.get('*', handleApp);

app.onError((error, {req: {raw: request}}) => {
  if (error instanceof Response) return error;

  if (request.headers.get('Accept')?.includes('application/json')) {
    return new Response(JSON.stringify({
      error: {
        message: 'Internal server error',
      },
    }), {status: 500});
  }

  return new Response('Internal server error', {status: 500});
});

let exported: any = app;

if (process.env.NODE_ENV === 'development') {
  // Wrap this in a format that @quilted/request-router can handle
  exported = function fetch(request: EnhancedRequest) {
    return app.fetch(request, {...process.env});
  };
}

export default exported;
