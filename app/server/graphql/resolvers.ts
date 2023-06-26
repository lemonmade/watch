import {
  App,
  AppInstallation,
  ClipsExtension,
  ClipsExtensionInstallation,
  ClipsExtensionVersion,
  ClipsExtensionSettingsField,
  ClipsExtensionSettingsString,
  ClipsExtensionPointSupportCondition,
  AppExtension,
  AppExtensionInstallation,
  Query as AppsQuery,
  Mutation as AppsMutation,
  User as AppsUser,
} from './resolvers/apps.ts';
import {
  Series,
  Season,
  Episode,
  Query as MediaQuery,
  Mutation as MediaMutation,
} from './resolvers/media.ts';
import {
  List,
  ListItem,
  Listable,
  Query as ListsQuery,
  Mutation as ListsMutation,
} from './resolvers/lists.ts';
import {Query as SearchQuery} from './resolvers/search.ts';
import {
  SeriesSubscription,
  Query as SubscriptionsQuery,
  Mutation as SubscriptionsMutation,
} from './resolvers/subscriptions.ts';
import {
  Watch,
  Skip,
  Action,
  WatchThrough,
  Watchable,
  Skippable,
  Query as WatchesQuery,
  Mutation as WatchesMutation,
} from './resolvers/watching.ts';
import {
  User as BaseUser,
  PersonalAccessToken,
  Passkey,
  GithubAccount,
  Subscription,
  Query as UsersQuery,
  Mutation as UsersMutation,
} from './resolvers/users.ts';

import type {QueryResolver, MutationResolver} from './resolvers/types.ts';

export const Query: QueryResolver = {
  version: () => 'unstable',
  ...AppsQuery,
  ...ListsQuery,
  ...MediaQuery,
  ...SearchQuery,
  ...SubscriptionsQuery,
  ...UsersQuery,
  ...WatchesQuery,
};

export const Mutation: MutationResolver = {
  ping: () => true,
  ...AppsMutation,
  ...ListsMutation,
  ...MediaMutation,
  ...SubscriptionsMutation,
  ...UsersMutation,
  ...WatchesMutation,
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
  ClipsExtensionSettingsField,
  ClipsExtensionSettingsString,
  ClipsExtensionPointSupportCondition,
  Episode,
  GithubAccount,
  List,
  Listable,
  ListItem,
  Passkey,
  PersonalAccessToken,
  Season,
  Series,
  SeriesSubscription,
  Skip,
  Skippable,
  Subscription,
  User,
  Watch,
  Watchable,
  WatchThrough,
};
