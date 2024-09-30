import {renderToResponse} from '@quilted/quilt/server';
import {RequestHandler} from '@quilted/quilt/request-router';
import {GraphQLCache, type GraphQLFetch} from '@quilted/quilt/graphql';
import {Router} from '@quilted/quilt/navigation';
import {BrowserAssets} from 'quilt:module/assets';

import type {AppContext} from '~/shared/context.ts';
import {ClipsManager} from '~/shared/clips.ts';

import App from '../App.tsx';
import {EXTENSION_POINTS} from '../clips.ts';

import {authenticate} from './shared/auth.ts';
import {createPrisma} from './shared/database.ts';

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

  const router = new Router(request.url);

  const context = {
    user,
    router,
    graphql: {cache: new GraphQLCache(), fetch: fetchGraphQL},
    clipsManager: user
      ? new ClipsManager(
          {user, graphql: fetchGraphQL, router},
          EXTENSION_POINTS,
        )
      : undefined,
  } satisfies AppContext;

  const response = await renderToResponse(<App context={context} />, {
    assets,
    request,
    serializations: [['app.user', user]],
  });

  return response;
};
