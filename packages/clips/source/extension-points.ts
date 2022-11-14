import type {
  RemoteRoot,
  RemoteChannel,
  RemoteComponentType,
} from '@remote-ui/core';

import type {
  Api,
  SharedGraphQLApi,
  SeriesDetailsGraphQLApi,
  WatchThroughDetailsGraphQLApi,
} from './api';
import type {CommonComponents} from './components';

export interface ExtensionPoints {
  'Series.Details.RenderAccessory': RenderExtension<
    'Series.Details.RenderAccessory',
    SeriesDetailsGraphQLApi
  >;
  'WatchThrough.Details.RenderAccessory': RenderExtension<
    'WatchThrough.Details.RenderAccessory',
    WatchThroughDetailsGraphQLApi
  >;
}

export type ExtensionPoint = keyof ExtensionPoints;

export type GraphQLApiForExtensionPoint<Point extends ExtensionPoint> =
  ExtensionPoints[Point] extends RenderExtension<any, infer GraphQLApi, any>
    ? GraphQLApi
    : never;

export type ComponentsForExtensionPoint<Point extends ExtensionPoint> =
  ExtensionPoints[Point] extends RenderExtension<any, any, infer Components>
    ? Components
    : never;

export interface RenderExtension<
  Point extends ExtensionPoint,
  _GraphQLApi = SharedGraphQLApi,
  Components extends {
    [key: string]: RemoteComponentType<string, any, any>;
  } = CommonComponents,
> {
  (
    root: RenderExtensionRoot<Components[keyof Components]>,
    api: Api<Point>,
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

export interface RenderExtensionRoot<
  AllowedComponents extends RemoteComponentType<string, any, any>,
> {
  readonly channel: RemoteChannel;
  readonly components: AllowedComponents[];
}
