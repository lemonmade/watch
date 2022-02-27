import type {Context} from '../context';
import type {Schema} from '../schema';

export type {Context};

export interface GraphQLTypeMap {
  Query: Record<string, never>;
  Mutation: Record<string, never>;
}

interface GraphQLServerOptions {
  readonly types: Schema;
  readonly baseValues: GraphQLTypeMap;
  readonly context: Context;
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
  : T extends {__possibleTypes: any}
  ? GraphQLReturnResult<T['__possibleTypes']>
  : T extends {__typename: any}
  ? T['__typename'] extends keyof GraphQLTypeMap
    ? GraphQLTypeMap[T['__typename']]
    : LiteralGraphQLObjectType<T>
  : never;

export type ResolverField<
  Type extends keyof GraphQLServerOptions['types'],
  Variables,
  ReturnType,
> = (
  value: BaseValue<Type>,
  variables: Variables,
  context: Context,
) => GraphQLReturnResult<ReturnType> | Promise<GraphQLReturnResult<ReturnType>>;

export type BaseValue<Type extends keyof GraphQLServerOptions['types']> =
  Type extends keyof GraphQLServerOptions['baseValues']
    ? GraphQLServerOptions['baseValues'][Type]
    : LiteralGraphQLObjectType<GraphQLServerOptions['types'][Type]>;

export type Resolver<Type extends keyof GraphQLServerOptions['types']> = {
  [Field in keyof GraphQLServerOptions['types'][Type]]?: GraphQLServerOptions['types'][Type][Field] extends (
    variables: infer Variables,
  ) => infer ReturnValue
    ? ResolverField<Type, Variables, ReturnValue>
    : never;
};

export type QueryResolver = Resolver<'Query'>;
export type MutationResolver = Resolver<'Mutation'>;

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
