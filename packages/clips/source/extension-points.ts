import type {
  RemoteRoot,
  RemoteChannel,
  RemoteComponentType,
} from '@remote-ui/core';

import type {AnyComponent} from './components';
import type {
  SeasonDetailsApi,
  SeriesDetailsApi,
  WatchThroughDetailsApi,
} from './api';

export interface RenderExtensionRoot<
  AllowedComponents extends RemoteComponentType<string, any, any>,
> {
  readonly channel: RemoteChannel;
  readonly components: AllowedComponents[];
}

export interface RenderExtension<
  Api,
  AllowedComponents extends RemoteComponentType<
    string,
    any,
    any
  > = AnyComponent,
> {
  (
    root: RenderExtensionRoot<AllowedComponents>,
    api: Api,
  ): void | Promise<void>;
}

export interface RenderExtensionWithRemoteRoot<
  Api,
  AllowedComponents extends RemoteComponentType<
    string,
    any,
    any
  > = AnyComponent,
> {
  (root: RemoteRoot<AllowedComponents>, api: Api): void | Promise<void>;
}

export interface ExtensionPoints {
  'Season.Details.RenderAccessory': RenderExtension<SeasonDetailsApi>;
  'Series.Details.RenderAccessory': RenderExtension<SeriesDetailsApi>;
  'WatchThrough.Details.RenderAccessory': RenderExtension<WatchThroughDetailsApi>;
}

export type ExtensionPoint = keyof ExtensionPoints;

export type ApiForExtensionPoint<T extends ExtensionPoint> =
  ExtensionPoints[T] extends RenderExtension<infer Api, any> ? Api : never;

export type AllowedComponentsForExtensionPoint<T extends ExtensionPoint> =
  ExtensionPoints[T] extends RenderExtension<any, infer AllowedComponents>
    ? AllowedComponents
    : never;
