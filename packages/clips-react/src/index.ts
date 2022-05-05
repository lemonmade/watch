export {extend} from '@watching/clips';
export type {
  Version,
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
  ClipsGlobal,
  AnyComponent,
  RenderExtension,
} from '@watching/clips';

export {render} from './render';
export {Text, View} from './components';
export {useApi, useConfiguration, useSubscription} from './hooks';
