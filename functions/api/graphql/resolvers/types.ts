import type {Context} from '../context';
import type {Query, Mutation} from '../schema';

export type {Context};

export interface GraphQLTypeMap {
  Query: Record<string, never>;
  Mutation: Record<string, never>;
}

export type GraphQLReturnResult<T> = T extends null
  ? null
  : T extends number
  ? number
  : T extends string
  ? string
  : T extends boolean
  ? boolean
  : T extends (infer U)[]
  ? GraphQLReturnResult<U>[]
  : T extends {__typename: any}
  ? T['__typename'] extends keyof GraphQLTypeMap
    ? GraphQLTypeMap[T['__typename']]
    : LiteralGraphQLObjectType<T>
  : never;

export type ResolverField<
  Type extends keyof GraphQLTypeMap,
  Variables,
  ReturnType,
> = (
  value: GraphQLTypeMap[Type],
  variables: Variables,
  context: Context,
) => GraphQLReturnResult<ReturnType> | Promise<GraphQLReturnResult<ReturnType>>;

export type Resolver<Type extends keyof GraphQLTypeMap, GraphQLType> = {
  [Field in keyof GraphQLType]?: GraphQLType[Field] extends (
    variables: infer Variables,
  ) => infer ReturnValue
    ? ResolverField<Type, Variables, ReturnValue>
    : never;
};

export type QueryResolver = Resolver<'Query', Query>;
export type MutationResolver = Resolver<'Query', Mutation>;

export interface InterfaceResolver {
  __resolveType(value: unknown): string;
}

export interface UnionResolver {
  __resolveType(value: unknown): string;
}

export type LiteralGraphQLObjectType<GraphQLType> = {
  [Field in Exclude<
    keyof GraphQLType,
    '__typename'
  >]: GraphQLType[Field] extends (variables: any) => infer ReturnValue
    ? GraphQLReturnResult<ReturnValue>
    : never;
};