import type {RemoteRoot, RemoteComponentType} from '@remote-ui/core';

import type {AnyComponent} from './components';
import type {
  SeasonDetailsApi,
  SeriesDetailsApi,
  WatchThroughDetailsApi,
} from './api';

export interface RenderExtensionResult {}

export interface RenderExtension<
  Api,
  AllowedComponents extends RemoteComponentType<string, any, any> = AnyComponent
> {
  (root: RemoteRoot<AllowedComponents>, api: Api): RenderExtensionResult | void;
}

export interface ExtensionPoints {
  'Watch::Season::Details': RenderExtension<SeasonDetailsApi>;
  'Watch::Series::Details': RenderExtension<SeriesDetailsApi>;
  'Watch::WatchThrough::Details': RenderExtension<WatchThroughDetailsApi>;
}

export type ExtensionPoint = keyof ExtensionPoints;

export type ApiForExtensionPoint<
  T extends ExtensionPoint
> = ExtensionPoints[T] extends RenderExtension<infer Api, any> ? Api : never;

export type AllowedComponentsForExtensionPoint<
  T extends ExtensionPoint
> = ExtensionPoints[T] extends RenderExtension<any, infer AllowedComponents>
  ? AllowedComponents
  : never;
