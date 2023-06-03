import {
  CommonComponents,
  createExtensionPoint,
  createSharedGraphQLApi,
} from '~/shared/clips.ts';

import startWatchThroughMutation from './graphql/StartWatchThroughMutation.graphql';

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
  mutate({id}, {object}) {
    return {
      async startWatchThrough(
        {from, to, includeSpecials, spoilerAvoidance, navigate},
        {graphql, router},
      ) {
        const {data} = await graphql(startWatchThroughMutation, {
          variables: {series: id, from, to, includeSpecials, spoilerAvoidance},
        });

        const shouldNavigate = navigate ?? true;
        const watchThrough = data?.startWatchThrough.watchThrough;

        if (shouldNavigate && watchThrough != null) {
          setTimeout(() => {
            router.navigate(watchThrough.url);
          }, 0);
        }

        return object('StartWatchThroughResult', {
          errors: [],
          watchThrough,
        });
      },
    };
  },
  components() {
    return CommonComponents;
  },
});
