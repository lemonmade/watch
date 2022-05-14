import {parse} from 'graphql';

import {
  run,
  createQueryResolver as createQueryResolverForSchema,
} from '@lemonmade/graphql-live';

import type {LocalApp} from '../../utilities/app';

import type {Schema} from './schema';
import type {Builder} from './types';

export interface Context {
  readonly rootUrl: URL;
}

export {run, parse};

export function createQueryResolver(
  app: LocalApp,
  {builder}: {builder: Builder},
) {
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

          return object('ClipsExtension', {
            id: extension.id,
            name: extension.name,
            supports: extension.extensionPoints.map((extensionPoint) =>
              object('ClipsExtensionPointSupport', {
                name: extensionPoint.id,
                module: extensionPoint.module,
                conditions:
                  extensionPoint.conditions?.map((condition) =>
                    object('ClipsExtensionPointCondition', {
                      series: condition.series
                        ? object('ClipsExtensionPointSeriesCondition', {
                            handle: condition.series.handle,
                          })
                        : null,
                    }),
                  ) ?? [],
              }),
            ),
            async *build(_, __, {signal}) {
              for await (const state of builder.watch(extension, {signal})) {
                switch (state.status) {
                  case 'success': {
                    yield object('ExtensionBuildSuccess', {
                      id: `gid://watch/ExtensionBuildSuccess/${extension.handle}/${state.id}`,
                      assets: [object('Asset', {source: assetUrl.href})],
                      startedAt: new Date(state.startedAt).toISOString(),
                      finishedAt: new Date(
                        state.startedAt + state.duration,
                      ).toISOString(),
                      duration: state.duration,
                    });
                    break;
                  }
                  case 'error': {
                    yield object('ExtensionBuildError', {
                      id: `gid://watch/ExtensionBuildError/${extension.handle}/${state.id}`,
                      startedAt: new Date(state.startedAt).toISOString(),
                      finishedAt: new Date(
                        state.startedAt + state.duration,
                      ).toISOString(),
                      duration: state.duration,
                      error: object('BuildError', {
                        message: state.errors[0]!.message,
                        stack: state.errors[0]!.stack,
                      }),
                    });
                    break;
                  }
                  case 'building': {
                    yield object('ExtensionBuildInProgress', {
                      id: `gid://watch/ExtensionBuildInProgress/${extension.handle}/${state.id}`,
                      startedAt: new Date(state.startedAt).toISOString(),
                    });
                    break;
                  }
                }
              }
            },
          });
        }),
      });
    }
  });
}
