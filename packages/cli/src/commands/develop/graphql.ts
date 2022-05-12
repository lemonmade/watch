import {parse} from 'graphql';

import {
  execute,
  createQueryResolver as createQueryResolverForSchema,
} from '@lemonmade/graphql-live';
import type {Schema} from './schema';
import type {LocalApp} from '../../utilities/app';

export interface Context {
  readonly rootUrl: URL;
}

export {execute, parse};

export function createQueryResolver(app: LocalApp) {
  return createQueryResolverForSchema<Schema, Context>(({object}) => {
    return {
      version: 'unstable',
      async *app(_, context, {signal}) {
        yield createGraphQLApp(app, context);

        for await (const currentApp of app.on('change', {signal})) {
          yield createGraphQLApp(currentApp, context);
        }
      },
    };

    function createGraphQLApp(app: Omit<LocalApp, 'on'>, {rootUrl}: Context) {
      return object('App', {
        name: app.name,
        extensions: app.extensions.map((extension) => {
          const assetUrl = new URL(
            `/assets/extensions/${extension.handle}.js`,
            rootUrl,
          );

          return object('Extension', {
            id: extension.id,
            name: extension.name,
            assets: [object('Asset', {source: assetUrl.href})],
          });
        }),
      });
    }
  });
}
