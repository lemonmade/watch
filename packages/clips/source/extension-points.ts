import type {
  RemoteConnection,
  RemoteRootElement,
} from '@remote-dom/core/elements';

import type {Api, ApiCore} from './api.ts';
import type {
  SharedGraphQLApi,
  SeriesDetailsGraphQLApi,
  WatchThroughDetailsGraphQLApi,
} from './graphql.ts';

export interface ExtensionPoints<
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
> {
  'series.details.accessory': RenderExtension<
    'series.details.accessory',
    Query,
    Settings,
    SeriesDetailsGraphQLApi
  >;
  'watch-through.details.accessory': RenderExtension<
    'watch-through.details.accessory',
    Query,
    Settings,
    WatchThroughDetailsGraphQLApi
  >;
}

export type ExtensionPointsCore<
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
> = {
  [Target in keyof ExtensionPoints]: ExtensionPoints<
    Query,
    Settings
  >[Target] extends RenderExtension<any, any, any, infer GraphQLApi>
    ? RenderExtensionCore<Target, Query, Settings, GraphQLApi>
    : never;
};

export type ExtensionPoint = keyof ExtensionPoints;

export type GraphQLApiForExtensionPoint<Point extends ExtensionPoint> =
  ExtensionPoints<any, any>[Point] extends RenderExtension<
    any,
    any,
    any,
    infer GraphQLApi
  >
    ? GraphQLApi
    : never;

export interface RenderExtension<
  Point extends ExtensionPoint,
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
  _GraphQLApi = SharedGraphQLApi,
> {
  (
    root: RemoteRootElement,
    api: Api<Point, Query, Settings>,
  ): void | Promise<void>;
}

export interface RenderExtensionCore<
  Point extends ExtensionPoint,
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
  _GraphQLApi = SharedGraphQLApi,
> {
  (
    connection: RemoteConnection,
    api: ApiCore<Point, Query, Settings>,
  ): void | Promise<void>;
}
