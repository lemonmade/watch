import type {Router} from '@quilted/quilt/navigation';
import type {GraphQLFetch} from '@quilted/quilt/graphql';
import {
  type ExtensionPoint,
  type SharedGraphQLApi,
  type GraphQLApiForExtensionPoint,
} from '@watching/clips';
import type {RemoteComponentRendererMap} from '@remote-dom/react/host';
import {
  type GraphQLLiveResolverCreateHelper,
  type GraphQLLiveResolverObject,
} from '@lemonmade/graphql-live';

export type GraphQLApiByExtensionPoint = {
  [Point in ExtensionPoint]: GraphQLApiForExtensionPoint<Point>;
};

export type GraphQLQueryResolverByExtensionPoint = {
  [Point in ExtensionPoint]: GraphQLQueryResolver<
    GraphQLApiByExtensionPoint[Point],
    ExtensionPointDefinitionContext
  >;
};

export type GraphQLMutationResolverByExtensionPoint = {
  [Point in ExtensionPoint]: GraphQLMutationResolver<
    GraphQLApiByExtensionPoint[Point],
    ExtensionPointDefinitionContext
  >;
};

type GraphQLQueryResolver<
  Types,
  Context = Record<string, never>,
> = Types extends {Query?: infer Query}
  ? Omit<GraphQLLiveResolverObject<Query, Context>, '__typename' | '__context'>
  : never;

type GraphQLMutationResolver<
  Types,
  Context = Record<string, never>,
> = Types extends {Mutation?: infer Mutation}
  ? Omit<
      GraphQLLiveResolverObject<Mutation, Context>,
      '__typename' | '__context'
    >
  : never;

export interface ExtensionPointDefinitionContext {
  readonly router: Router;
  readonly graphql: GraphQLFetch;
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
  mutate?(
    options: Options,
    helpers: GraphQLLiveResolverCreateHelper<
      GraphQLApiByExtensionPoint[Point],
      ExtensionPointDefinitionContext
    >,
  ): GraphQLMutationResolverByExtensionPoint[Point];
  components(): RemoteComponentRendererMap;
}

export type ExtensionPointDefinitions =
  typeof import('../../clips').EXTENSION_POINTS;
export type OptionsForExtensionPoint<Point extends ExtensionPoint> =
  ExtensionPointDefinitions[Point] extends ExtensionPointDefinition<
    any,
    infer Options
  >
    ? Options
    : never;

export type ExtensionPointDefinitionOptions = {
  [Point in ExtensionPoint]: OptionsForExtensionPoint<Point>;
};

export type ExtensionPointWithOptions = {
  [Point in ExtensionPoint]: ExtensionPointDefinitionOptions[Point] extends never
    ? never
    : Point;
}[ExtensionPoint];

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
