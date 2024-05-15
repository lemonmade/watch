import {renderToResponse} from '@quilted/quilt/server';
import {RequestHandler} from '@quilted/quilt/request-router';
import type {GraphQLFetch} from '@quilted/quilt/graphql';
import {BrowserAssets} from 'quilt:module/assets';

import {authenticate} from './shared/auth.ts';
import {createPrisma} from './shared/database.ts';

const assets = new BrowserAssets();

export const handleApp: RequestHandler = async function handleApp(request) {
  if (request.method !== 'GET') {
    return new Response(null, {status: 405, headers: {Allow: 'GET'}});
  }

  const [{App}, auth] = await Promise.all([
    import('../App.tsx'),
    authenticate(request),
  ]);

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

  const response = await renderToResponse(
    <App context={{user, fetchGraphQL}} />,
    {
      assets,
      request,
    },
  );

  return response;
};
