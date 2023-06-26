import {
  SeriesSubscription,
  Query as SeriesSubscriptionQuery,
  Mutation as SeriesSubscriptionMutation,
  Series as SeriesSubscriptionSeries,
} from './subscriptions/SeriesSubscription.ts';

export {SeriesSubscription};

export const Query = {...SeriesSubscriptionQuery};

export const Mutation = {...SeriesSubscriptionMutation};

export const Series = {...SeriesSubscriptionSeries};
