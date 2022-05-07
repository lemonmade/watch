import type {
  GraphQLResolver,
  GraphQLResolverOptions,
  GraphQLBaseResolverValueMap,
} from '@watching/graphql/server';
import type {Request} from '@quilted/http-handlers';

import {makeExecutableSchema} from '@graphql-tools/schema';

import schemaTypeDefinitions from './schema';
import type {Schema} from './schema';
import type {LocalApp} from '../../utilities/app';

interface Context {
  readonly request: Request;
}

type ResolverOptions = GraphQLResolverOptions<
  Schema,
  GraphQLBaseResolverValueMap,
  Context
>;

type QueryResolver = GraphQLResolver<'Query', ResolverOptions>;

export function createSchema(app: LocalApp) {
  return makeExecutableSchema({
    typeDefs: schemaTypeDefinitions,
    resolvers: {
      Query: {
        app: (_, __, {request}) => {
          return {
            name: app.name,
            extensions: app.extensions.map((extension) => {
              const assetUrl = new URL(
                `/assets/extensions/${extension.id}.js`,
                request.url,
              );

              const socketUrl = new URL(
                extension.id,
                `ws://${request.url.host}`,
              );

              return {
                id: `gid://watch-local/ClipsExtension/${extension.id}`,
                name: extension.name,
                socketUrl: socketUrl.href,
                assets: [{source: assetUrl.href}],
              };
            }),
          };
        },
        version: () => 'unstable',
      } as QueryResolver,
    },
  });
}
