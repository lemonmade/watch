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

export {extension} from './extension';
export {Text, View} from './components';
export {useApi, useSettings, useSubscription} from './hooks';
