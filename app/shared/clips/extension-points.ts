import {
  type ExtensionPoint,
  type SharedGraphQLApi,
  type GraphQLApiForExtensionPoint,
} from '@watching/clips';
import {RemoteComponentRendererMap} from '@lemonmade/remote-ui-react/host';
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
