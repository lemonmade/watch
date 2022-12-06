import {
  CommonComponents,
  createExtensionPoint,
  createSharedGraphQLApi,
} from '~/shared/clips';

export interface SeriesDetailsRenderAccessoryOptions {
  readonly id: string;
  readonly name: string;
}

export const SeriesDetailsRenderAccessoryExtensionPoint = createExtensionPoint({
  name: 'Series.Details.RenderAccessory',
  query({id, name}: SeriesDetailsRenderAccessoryOptions, {object}) {
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