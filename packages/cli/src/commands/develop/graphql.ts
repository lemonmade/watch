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
  return createQueryResolverForSchema<Schema, Context>(({object}) => ({
    version: 'unstable',
    async *app(_, {rootUrl}, {signal}) {
      while (!signal.aborted) {
        yield object('App', {
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

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    },
  }));
}
