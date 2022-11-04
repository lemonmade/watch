import * as path from 'path';
import {readFile} from 'fs/promises';
import {parse} from 'graphql';
import {watch} from 'chokidar';

import {createEmitter} from '@quilted/events';
import {
  run,
  createQueryResolver as createQueryResolverForSchema,
} from '@lemonmade/graphql-live';

import {previewUrl} from '../../utilities/preview';
import type {LocalApp, LocalExtension} from '../../utilities/app';

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

    function createGraphQLApp(app: Omit<LocalApp, 'on'>, context: Context) {
      return object('App', {
        id: app.id,
        name: app.name,
        handle: app.handle,
        extensions: app.extensions.map((extension) =>
          createGraphQLCLipsExtension(extension, context),
        ),
        extension({id}) {
          const found = app.extensions.find((extension) => extension.id === id);
          return found && createGraphQLCLipsExtension(found, context);
        },
        clipsExtension({id}) {
          const found = app.extensions.find((extension) => extension.id === id);
          return found && createGraphQLCLipsExtension(found, context);
        },
      });
    }

    function createGraphQLCLipsExtension(
      extension: LocalExtension,
      {rootUrl}: Context,
    ) {
      const assetUrl = new URL(
        `/assets/extensions/${extension.id.split('/').pop()}.js`,
        rootUrl,
      );

      return object('ClipsExtension', {
        id: extension.id,
        name: extension.name,
        handle: extension.handle,
        extends: extension.extends.map((extensionPoint) =>
          object('ClipsExtensionPointSupport', {
            target: extensionPoint.target,
            module: extensionPoint.module,
            async *liveQuery(_, __, {signal}) {
              if (extensionPoint.query == null) return null;

              for await (const {content} of watchFile(
                path.resolve(extension.root, extensionPoint.query),
                {signal},
              )) {
                yield object('ClipsExtensionPointLiveQuery', {
                  file: extensionPoint.query,
                  query: content,
                });
              }
            },
            preview: object('ClipsExtensionPointPreview', {
              url: async ({connect}, {rootUrl}) => {
                const url = await previewUrl(extension, {
                  extensionPoint,
                  connect: connect ? rootUrl : false,
                });

                return url.href;
              },
            }),
            conditions:
              extensionPoint.conditions?.map((condition) =>
                object('ClipsExtensionPointSupportCondition', {
                  series: condition.series
                    ? object('ClipsExtensionPointSupportSeriesCondition', {
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
                  assets: [
                    object('Asset', {
                      source: assetUrl.href,
                    }),
                  ],
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
    }
  });
}

async function* watchFile(file: string, {signal}: {signal: AbortSignal}) {
  const watcher = watch(file, {ignoreInitial: true});

  const emitter = createEmitter<{change: void}>();

  const handler = () => {
    emitter.emit('change');
  };

  watcher.on('change', handler);

  signal.addEventListener(
    'abort',
    () => {
      watcher.off('change', handler);
    },
    {once: true},
  );

  yield {file, content: await readFile(file, 'utf8')};

  for await (const _ of emitter.on('change', {signal})) {
    yield {file, content: await readFile(file, 'utf8')};
  }
}
