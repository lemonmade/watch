import {signalToIterator, type Signal} from '@quilted/quilt/signals';

import {
  CommonComponents,
  createExtensionPoint,
  createSharedGraphQLApi,
} from '~/shared/clips.ts';

import {type WatchForm} from './WatchThrough.tsx';

export interface WatchThroughDetailsAccessoryOptions {
  readonly id: string;
  readonly url: string;
  readonly seriesId: string;
  readonly seriesName: string;
  readonly currentWatch: Signal<WatchForm | undefined>;
}

export const WatchThroughDetailsAccessoryExtensionPoint = createExtensionPoint({
  name: 'watch-through.details.accessory',
  query(
    {
      id,
      url,
      seriesId,
      seriesName,
      currentWatch: currentWatchSignal,
    }: WatchThroughDetailsAccessoryOptions,
    helpers,
  ) {
    const object = helpers.object;

    return {
      ...createSharedGraphQLApi(helpers),
      watchThrough: object('WatchThrough', {
        id,
        url,
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
                  yield object('WatchThroughNotes', {
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
