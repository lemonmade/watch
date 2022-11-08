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
    GraphQLApiByExtensionPoint[Point],
    ExtensionPointDefinitionContext
  >;
};

type GraphQLQueryResolver<
  Types extends {Query: any},
  Context = Record<string, never>,
> = Omit<
  GraphQLLiveResolverObject<Types['Query'], Context>,
  '__typename' | '__context'
>;

export interface ExtensionPointDefinitionContext {
  readonly user: {readonly id: string};
}

export interface ExtensionPointDefinition<
  Point extends ExtensionPoint,
  Options = never,
> {
  name: Point;
  query(
    options: Options,
    helpers: GraphQLLiveResolverCreateHelper<
      GraphQLApiByExtensionPoint[Point],
      ExtensionPointDefinitionContext
    >,
  ): GraphQLQueryResolverByExtensionPoint[Point];
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

export function createSharedGraphQLApi({
  object,
}: GraphQLLiveResolverCreateHelper<
  SharedGraphQLApi,
  ExtensionPointDefinitionContext
>): Omit<
  GraphQLLiveResolverObject<
    SharedGraphQLApi['Query'],
    ExtensionPointDefinitionContext
  >,
  '__typename' | '__context'
> {
  return {
    version: 'unstable',
    user: object('User', {
      id: (_, {user}) => user.id,
    }),
  };
}
