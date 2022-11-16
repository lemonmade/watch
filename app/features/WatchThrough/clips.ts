import {type Signal} from '@quilted/quilt';
import {signalToIterator} from '@watching/thread-signals';
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
        currentWatch: currentWatchSignal,
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
            yield* currentWatch(signal);
          },
        }),
      };

      async function* currentWatch(signal: AbortSignal) {
        for await (const watch of signalToIterator(currentWatchSignal, {
          signal,
        })) {
          if (watch == null) {
            yield null;
          } else {
            yield object('WatchThroughCurrentWatch', {
              rating: (_, __, {signal}) =>
                signalToIterator(watch.rating, {signal}),
              async *finishedAt(_, __, {signal}) {
                for await (const at of signalToIterator(watch.at, {signal})) {
                  yield at?.toString();
                }
              },
              async *notes(_, __, {signal}) {
                for await (const content of signalToIterator(
                  watch.notes.content,
                  {signal},
                )) {
                  if (content) {
                    yield object('Notes', {
                      content,
                      containsSpoilers: (_, __, {signal}) =>
                        signalToIterator(watch.notes.containsSpoilers, {
                          signal,
                        }),
                    });
                  } else {
                    yield null;
                  }
                }
              },
            });
          }
        }
      }
    },
    components() {
      return CommonComponents;
    },
  });
