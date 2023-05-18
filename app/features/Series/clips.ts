import {
  CommonComponents,
  createExtensionPoint,
  createSharedGraphQLApi,
} from '~/shared/clips.ts';

export interface SeriesDetailsAccessoryOptions {
  readonly id: string;
  readonly name: string;
}

export const SeriesDetailsAccessoryExtensionPoint = createExtensionPoint({
  name: 'series.details.accessory',
  query({id, name}: SeriesDetailsAccessoryOptions, {object}) {
    return {
      ...createSharedGraphQLApi({object}),
      series: object('Series', {
        id,
        async *name(_, __, {signal}) {
          let index = 0;

          while (!signal.aborted) {
            yield `${name} ${index++}`;
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        },
      }),
    };
  },
  components() {
    return CommonComponents;
  },
});
