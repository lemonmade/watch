import type {
  RemoteRootElement,
  RemoteMutationCallback,
} from '@lemonmade/remote-ui/elements';

import type {
  Api,
  SharedGraphQLApi,
  SeriesDetailsGraphQLApi,
  WatchThroughDetailsGraphQLApi,
} from './api.ts';

export interface ExtensionPoints {
  'series.details.accessory': RenderExtension<
    'series.details.accessory',
    SeriesDetailsGraphQLApi
  >;
  'watch-through.details.accessory': RenderExtension<
    'watch-through.details.accessory',
    WatchThroughDetailsGraphQLApi
  >;
}

export type ExtensionPoint = keyof ExtensionPoints;

export type GraphQLApiForExtensionPoint<Point extends ExtensionPoint> =
  ExtensionPoints[Point] extends RenderExtension<any, infer GraphQLApi>
    ? GraphQLApi
    : never;

export interface RenderExtension<
  Point extends ExtensionPoint,
  _GraphQLApi = SharedGraphQLApi,
> {
  (callback: RemoteMutationCallback, api: Api<Point>): void | Promise<void>;
}

export interface RenderExtensionWithRemoteRoot<
  Api,
  _GraphQLApi = SharedGraphQLApi,
> {
  (root: RemoteRootElement, api: Api): void | Promise<void>;
}
