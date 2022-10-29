import type {
  RemoteRoot,
  RemoteChannel,
  RemoteComponentType,
} from '@remote-ui/core';

import type {CommonComponents} from './components';
import type {SeriesDetailsApi, WatchThroughDetailsApi} from './api';

export interface RenderExtensionRoot<
  AllowedComponents extends RemoteComponentType<string, any, any>,
> {
  readonly channel: RemoteChannel;
  readonly components: AllowedComponents[];
}

export interface RenderExtension<
  Api,
  Components extends {
    [key: string]: RemoteComponentType<string, any, any>;
  } = CommonComponents,
> {
  (
    root: RenderExtensionRoot<Components[keyof Components]>,
    api: Api,
  ): void | Promise<void>;
}

export interface RenderExtensionWithRemoteRoot<
  Api,
  Components extends {
    [key: string]: RemoteComponentType<string, any, any>;
  } = CommonComponents,
> {
  (
    root: RemoteRoot<Components[keyof Components]>,
    api: Api,
  ): void | Promise<void>;
}

export interface ExtensionPoints {
  'Series.Details.RenderAccessory': RenderExtension<SeriesDetailsApi>;
  'WatchThrough.Details.RenderAccessory': RenderExtension<WatchThroughDetailsApi>;
}

export type ExtensionPoint = keyof ExtensionPoints;

export type ApiForExtensionPoint<Point extends ExtensionPoint> =
  ExtensionPoints[Point] extends RenderExtension<infer Api, any> ? Api : never;

export type ComponentsForExtensionPoint<Point extends ExtensionPoint> =
  ExtensionPoints[Point] extends RenderExtension<any, infer Components>
    ? Components
    : never;
