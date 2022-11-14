import {createEmitter, type Signal} from '@quilted/quilt';
import {
  CommonComponents,
  createExtensionPoint,
  createSharedGraphQLApi,
} from '~/shared/clips';

import {type WatchForm} from './WatchThrough';

export interface WatchThroughDetailsRenderAccessoryOptions {
  readonly id: string;
  readonly seriesId: string;
  readonly seriesName: string;
  readonly currentWatch: Signal<WatchForm | undefined>;
}

export const WatchThroughDetailsRenderAccessoryExtensionPoint =
  createExtensionPoint({
    name: 'WatchThrough.Details.RenderAccessory',
    query(
      {
        id,
        seriesId,
        seriesName,
        currentWatch,
      }: WatchThroughDetailsRenderAccessoryOptions,
      helpers,
    ) {
      const object = helpers.object;

      return {
        ...createSharedGraphQLApi(helpers),
        watchThrough: object('WatchThrough', {
          id,
          series: object('Series', {id: seriesId, name: seriesName}),
          async *currentWatch(_, __, {signal}) {
            for await (const watch of signalToIterator(currentWatch, signal)) {
              if (watch == null) {
                yield null;
              } else {
                yield object('WatchThroughCurrentWatch', {
                  rating: (_, __, {signal}) =>
                    signalToIterator(watch.rating, signal),
                  async *finishedAt(_, __, {signal}) {
                    for await (const at of signalToIterator(watch.at, signal)) {
                      yield at?.toString();
                    }
                  },
                  async *notes(_, __, {signal}) {
                    for await (const content of signalToIterator(
                      watch.notes.content,
                      signal,
                    )) {
                      if (content) {
                        yield object('Notes', {
                          content,
                          containsSpoilers: (_, __, {signal}) =>
                            signalToIterator(
                              watch.notes.containsSpoilers,
                              signal,
                            ),
                        });
                      } else {
                        yield null;
                      }
                    }
                  },
                });
                // yield object('WatchThroughCurrentWatch', {

                //   // finishedAt: (_, __, {signal}) =>
                //   //   signalToIterator(watch.at, signal),
                // });
              }
            }
          },
        }),
      };
    },
    components() {
      return CommonComponents;
    },
  });

function signalToIterator<T>(signal: Signal<T>, abortSignal: AbortSignal) {
  const emitter = createEmitter<{value: T}>();

  const unsubscribe = signal.subscribe((value) => {
    emitter.emit('value', value);
  });

  abortSignal.addEventListener('abort', () => {
    unsubscribe();
  });

  return run();

  async function* run() {
    yield signal.peek();

    if (abortSignal.aborted) return;

    for await (const value of emitter.on('value', {signal: abortSignal})) {
      yield value;
    }
  }
}
