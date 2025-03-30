import {renderAppToHTMLResponse} from '@quilted/quilt/server';
import {GraphQLCache, type GraphQLFetch} from '@quilted/quilt/graphql';
import {Router} from '@quilted/quilt/navigation';
import {BrowserAssets} from 'quilt:module/assets';

import type {AppContext} from '~/shared/context.ts';
import {ClipsManager} from '~/shared/clips.ts';

import App from '../App.tsx';
import {EXTENSION_POINTS} from '../clips.ts';
import type {SerializedEnvironmentFromServer} from '../browser/environment.ts';

import {authenticate} from './shared/auth.ts';
import {createResponseHandler} from './shared/response.ts';

const assets = new BrowserAssets();

export const handleApp = createResponseHandler(async function handleApp(
  request,
  {env, var: {prisma: prismaContext, environment}},
) {
  if (request.method !== 'GET') {
    return new Response(null, {status: 405, headers: {Allow: 'GET'}});
  }

  const prisma = await prismaContext.load();

  const [auth] = await Promise.all([authenticate(request, {prisma, env})]);

  const user = auth.user
    ? {
        ...auth.user,
        id: `gid://watch/User/${auth.user.id}`,
      }
    : undefined;

  const fetchGraphQL: GraphQLFetch = async (operation, {variables} = {}) => {
    const [{fetchGraphQL: fetchGraphQLBase}] = await Promise.all([
      import('./graphql/fetch.ts'),
    ]);

    const result = await fetchGraphQLBase(operation, {
      variables,
      context: {
        env,
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

  const graphql = {cache: new GraphQLCache(), fetch: fetchGraphQL};

  const context = {
    environment,
    user,
    router,
    graphql,
    clipsManager: user
      ? new ClipsManager({user, graphql, router}, EXTENSION_POINTS)
      : undefined,
  } satisfies AppContext;

  const response = await renderAppToHTMLResponse(<App context={context} />, {
    assets,
    request,
    serializations: [
      ['app.user', user],
      [
        'app.environment',
        {
          preview: environment.preview,
          debug: environment.debug,
        } satisfies SerializedEnvironmentFromServer,
      ],
    ],
  });

  return response;
});
