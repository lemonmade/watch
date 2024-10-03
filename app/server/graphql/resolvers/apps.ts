import {
  App,
  AppInstallation,
  AppExtension,
  AppExtensionInstallation,
  Query as AppQuery,
  Mutation as AppMutation,
  User as AppUser,
} from './apps/App.ts';
import {
  ClipsExtension,
  ClipsExtensionInstallation,
  ClipsExtensionPointInstallation,
  ClipsExtensionPointSupportCondition,
  ClipsExtensionSettingsField,
  ClipsExtensionSettingsString,
  ClipsExtensionVersion,
  Query as ClipsExtensionQuery,
  Mutation as ClipsExtensionMutation,
  Series as ClipsExtensionSeries,
  WatchThrough as ClipsExtensionWatchThrough,
} from './apps/ClipsExtension.ts';

export {
  App,
  AppInstallation,
  AppExtension,
  AppExtensionInstallation,
  ClipsExtension,
  ClipsExtensionInstallation,
  ClipsExtensionPointInstallation,
  ClipsExtensionPointSupportCondition,
  ClipsExtensionSettingsField,
  ClipsExtensionSettingsString,
  ClipsExtensionVersion,
};

export const Query = {...AppQuery, ...ClipsExtensionQuery};

export const Mutation = {...AppMutation, ...ClipsExtensionMutation};

export const User = {...AppUser};

export const Series = {...ClipsExtensionSeries};

export const WatchThrough = {...ClipsExtensionWatchThrough};
