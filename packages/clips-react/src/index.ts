export {extend} from '@watching/clips';
export type {
  ExtensionPoint,
  ExtensionPoints,
  ApiForExtensionPoint,
  AllowedComponentsForExtensionPoint,
  AnyApi,
  StandardApi,
  SeasonDetailsApi,
  SeriesDetailsApi,
  WatchThroughDetailsApi,
  ClipsApi,
} from '@watching/clips';

export {render} from './render';
export {Text, View} from './components';
export {useApi, useConfiguration, useSubscription} from './hooks';
