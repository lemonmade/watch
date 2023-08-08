import * as path from 'path';
import {readFile, readdir} from 'fs/promises';
import {parse} from 'graphql';
import {watch} from 'chokidar';

import {EventEmitter} from '@quilted/cli-kit';
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
        async *translations(_, __, {signal}) {
          for await (const {content} of watchDirectory(
            path.resolve(extension.root, 'translations'),
            {signal},
          )) {
            if (content == null) {
              yield [];
            } else {
              yield Object.entries(content).map(([locale, fileContent]) =>
                object('ClipsExtensionTranslation', {
                  locale: locale.replace(/\.json$/, ''),
                  dictionary: JSON.stringify(JSON.parse(fileContent)),
                }),
              );
            }
          }
        },
        extends: extension.extends.map((extensionPoint) =>
          object('ClipsExtensionPointSupport', {
            target: extensionPoint.target,
            module: extensionPoint.module,
            async *loading(_, __, {signal}) {
              const ui = extensionPoint.loading?.ui;
              if (ui == null) return null;

              const {parseLoadingHtml, serializeLoadingHtml} = await import(
                '@watching/tools/loading'
              );

              if (ui.endsWith('.html')) {
                for await (const {content} of watchFile(
                  path.resolve(extension.root, ui),
                  {signal},
                )) {
                  const tree = parseLoadingHtml(content);

                  yield object('ClipsExtensionPointLoading', {
                    ui: object('ClipsExtensionPointLoadingUi', {
                      file: ui,
                      tree: () => JSON.stringify(tree),
                      html: () => serializeLoadingHtml(tree),
                    }),
                  });
                }
              } else {
                const tree = parseLoadingHtml(ui);

                return object('ClipsExtensionPointLoading', {
                  ui: object('ClipsExtensionPointLoadingUi', {
                    file: extension.configurationFile.path,
                    tree: () => JSON.stringify(tree),
                    html: () => serializeLoadingHtml(tree),
                  }),
                });
              }
            },
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
  const emitter = createWatchEmitter(file, {signal});

  yield {file, content: await readFile(file, 'utf8')};

  for await (const _ of emitter.on('change', {signal})) {
    yield {file, content: await readFile(file, 'utf8')};
  }
}

async function* watchDirectory(
  directory: string,
  {signal}: {signal: AbortSignal},
) {
  const emitter = createWatchEmitter(directory, {signal});

  yield {directory, content: await readDirectoryContents(directory)};

  for await (const _ of emitter.on('change', {signal})) {
    yield {directory, content: await readDirectoryContents(directory)};
  }
}

async function readDirectoryContents(directory: string) {
  try {
    const files = await readdir(directory);
    const fileMap: Record<string, string> = {};
    await Promise.all(
      files.map(async (file) => {
        try {
          const content = await readFile(path.resolve(directory, file), 'utf8');
          fileMap[path.basename(file)] = content;
        } catch {
          // noop
        }
      }),
    );

    return fileMap;
  } catch {
    return undefined;
  }
}

function createWatchEmitter(path: string, {signal}: {signal: AbortSignal}) {
  const watcher = watch(path, {ignoreInitial: true});

  const events = new EventEmitter<{change: void}>();

  const handler = () => {
    events.emit('change');
  };

  watcher.on('add', handler);
  watcher.on('change', handler);
  watcher.on('unlink', handler);

  signal.addEventListener(
    'abort',
    () => {
      watcher.off('add', handler);
      watcher.off('change', handler);
      watcher.off('unlink', handler);
    },
    {once: true},
  );

  return events;
}
