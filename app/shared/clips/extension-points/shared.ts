import type {
  ExtensionPoint,
  ComponentsForExtensionPoint,
  SharedGraphQLApi,
  GraphQLApiForExtensionPoint,
} from '@watching/clips';
import {
  type GraphQLLiveResolverCreateHelper,
  type GraphQLLiveResolverObject,
} from '@lemonmade/graphql-live';
import {type ReactComponentTypeFromRemoteComponentType} from '@remote-ui/react';

export type ReactComponentsForExtensionPoint<Point extends ExtensionPoint> = {
  [Component in keyof ComponentsForExtensionPoint<Point>]: ReactComponentTypeFromRemoteComponentType<
    ComponentsForExtensionPoint<Point>[Component]
  >;
};

export type GraphQLApiByExtensionPoint = {
  [Point in ExtensionPoint]: GraphQLApiForExtensionPoint<Point>;
};

export type GraphQLQueryResolverByExtensionPoint = {
  [Point in ExtensionPoint]: GraphQLQueryResolver<
    GraphQLApiByExtensionPoint[Point]
  >;
};

type GraphQLQueryResolver<
  Types extends {Query: any},
  Context = Record<string, never>,
> = (
  helpers: GraphQLLiveResolverCreateHelper<Types, Context>,
) => Omit<
  GraphQLLiveResolverObject<Types['Query'], Context>,
  '__typename' | '__context'
>;

export interface ExtensionPointDefinition<
  Point extends ExtensionPoint,
  Options = never,
> {
  name: Point;
  query(options: Options): GraphQLQueryResolverByExtensionPoint[Point];
  components(): ReactComponentsForExtensionPoint<Point>;
}

export function createExtensionPoint<
  Point extends ExtensionPoint,
  Options = never,
>(
  extensionPoint: ExtensionPointDefinition<Point, Options>,
): ExtensionPointDefinition<Point, Options> {
  return extensionPoint;
}

export function createSharedGraphQLApi(
  _helpers: GraphQLLiveResolverCreateHelper<SharedGraphQLApi>,
): Omit<
  GraphQLLiveResolverObject<SharedGraphQLApi['Query']>,
  '__typename' | '__context'
> {
  return {
    version: 'unstable',
  };
}
