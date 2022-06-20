import {
  App,
  AppInstallation,
  ClipsExtension,
  ClipsExtensionInstallation,
  ClipsExtensionVersion,
  ClipsExtensionConfigurationField,
  ClipsExtensionConfigurationString,
  ClipsExtensionPointCondition,
  AppExtension,
  AppExtensionInstallation,
  Query as AppsQuery,
  Mutation as AppsMutation,
  User as AppsUser,
} from './apps';
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
  User as BaseUser,
  PersonalAccessToken,
  GithubAccount,
  Query as UsersQuery,
  Mutation as UsersMutation,
} from './users';

import type {QueryResolver, MutationResolver} from './types';

export const Query: QueryResolver = {
  version: () => 'unstable',
  ...AppsQuery,
  ...ListsQuery,
  ...MediaQuery,
  ...SearchQuery,
  ...SubscriptionsQuery,
  ...UsersQuery,
  ...WatchesQuery,
  ...WatchLaterQuery,
};

export const Mutation: MutationResolver = {
  ping: () => true,
  ...AppsMutation,
  ...ListsMutation,
  ...MediaMutation,
  ...SubscriptionsMutation,
  ...UsersMutation,
  ...WatchesMutation,
  ...WatchLaterMutation,
};

const User = {
  ...BaseUser,
  ...AppsUser,
};

export {
  Action,
  App,
  AppExtension,
  AppExtensionInstallation,
  AppInstallation,
  ClipsExtension,
  ClipsExtensionInstallation,
  ClipsExtensionVersion,
  ClipsExtensionConfigurationField,
  ClipsExtensionConfigurationString,
  ClipsExtensionPointCondition,
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
