import {AsyncComponent} from '@quilted/quilt/async';
import {renderToResponse} from '@quilted/quilt/server';
import {RequestHandler} from '@quilted/quilt/request-router';
import type {GraphQLFetch} from '@quilted/quilt/graphql';
import {Router} from '@quilted/quilt/navigation';
import {BrowserAssets} from 'quilt:module/assets';

import type {AppContext} from '~/shared/context.ts';

import {authenticate} from './shared/auth.ts';
import {createPrisma} from './shared/database.ts';

const App = AsyncComponent.from(() => import('../App.tsx'));

const assets = new BrowserAssets();

export const handleApp: RequestHandler = async function handleApp(request) {
  if (request.method !== 'GET') {
    return new Response(null, {status: 405, headers: {Allow: 'GET'}});
  }

  const [auth] = await Promise.all([authenticate(request)]);

  const user = auth.user
    ? {
        ...auth.user,
        id: `gid://watch/User/${auth.user.id}`,
      }
    : undefined;

  const fetchGraphQL: GraphQLFetch = async (operation, {variables} = {}) => {
    const [prisma, {fetchGraphQL: fetchGraphQLBase}] = await Promise.all([
      createPrisma(),
      import('./graphql/fetch.ts'),
    ]);

    const result = await fetchGraphQLBase(operation, {
      variables,
      context: {
        prisma,
        request,
        response: {} as any,
        get user() {
          if (auth.user == null) {
            // TODO
            throw new Error('No user exists for this request!');
          }

          return auth.user;
        },
      },
    });

    return result;
  };

  const [{QueryClient}] = await Promise.all([import('@tanstack/react-query')]);

  const context = {
    user,
    router: new Router(),
    fetchGraphQL,
    queryClient: new QueryClient(),
  } satisfies AppContext;

  const response = await renderToResponse(<App context={context} />, {
    assets,
    request,
    serializations: [['app.user', user]],
  });

  return response;
};
