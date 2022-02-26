import {
  Series,
  Season,
  Episode,
  Query as MediaQuery,
  Mutation as MediaMutation,
} from './media';
import {
  List,
  ListItem,
  Listable,
  Query as ListsQuery,
  Mutation as ListsMutation,
} from './lists';
import {Query as SearchQuery} from './search';
import {
  SeriesSubscription,
  Query as SubscriptionsQuery,
  Mutation as SubscriptionsMutation,
} from './subscriptions';
import {
  Watch,
  Skip,
  Action,
  WatchThrough,
  Watchable,
  Skippable,
  Query as WatchesQuery,
  Mutation as WatchesMutation,
} from './watches';
import {
  Query as WatchLaterQuery,
  Mutation as WatchLaterMutation,
} from './watch-later';
import {
  User,
  PersonalAccessToken,
  GithubAccount,
  Query as UsersQuery,
  Mutation as UsersMutation,
} from './users';

export const Query = {
  ...ListsQuery,
  ...MediaQuery,
  ...SearchQuery,
  ...SubscriptionsQuery,
  ...WatchesQuery,
  ...WatchLaterQuery,
  ...UsersQuery,
};

export const Mutation = {
  ...ListsMutation,
  ...MediaMutation,
  ...SubscriptionsMutation,
  ...WatchesMutation,
  ...WatchLaterMutation,
  ...UsersMutation,
};

export {
  Action,
  Episode,
  GithubAccount,
  List,
  Listable,
  ListItem,
  PersonalAccessToken,
  Season,
  Series,
  SeriesSubscription,
  Skip,
  Skippable,
  User,
  Watch,
  Watchable,
  WatchThrough,
};
