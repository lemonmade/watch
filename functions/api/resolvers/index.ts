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
import {
  SeriesSubscription,
  Query as SubscriptionsQuery,
  Mutation as SubscriptionsMutation,
} from './subscriptions';
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
  ...SubscriptionsQuery,
  ...WatchLaterQuery,
  ...UsersQuery,
};

export const Mutation = {
  ...ListsMutation,
  ...MediaMutation,
  ...SubscriptionsMutation,
  ...WatchLaterMutation,
  ...UsersMutation,
};

export {
  Episode,
  GithubAccount,
  List,
  Listable,
  ListItem,
  PersonalAccessToken,
  Season,
  Series,
  SeriesSubscription,
  User,
};
