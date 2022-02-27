export interface GraphQLBaseResolverValueMap {
  Query: Record<string, never>;
  Mutation: Record<string, never>;
}

export interface GraphQLResolverOptions<Types, Values, Context> {
  readonly types: Types;
  readonly values: Values;
  readonly context: Context;
}

export type GraphQLSimpleReturnResult<
  Type,
  Options extends GraphQLResolverOptions<any, any, any>,
> = {
  [Field in Exclude<keyof Type, '__typename'>]: Type[Field] extends (
    variables: any,
  ) => infer ReturnValue
    ? GraphQLReturnResult<ReturnValue, Options>
    : never;
};

export type GraphQLReturnResult<
  Type,
  Options extends GraphQLResolverOptions<any, any, any>,
> = Type extends null
  ? null
  : Type extends number
  ? number
  : Type extends string
  ? string
  : Type extends boolean
  ? boolean
  : Type extends (infer U)[]
  ? GraphQLReturnResult<U, Options>[]
  : Type extends {__possibleTypes: any}
  ? GraphQLReturnResult<Type['__possibleTypes'], Options>
  : Type extends {__typename: any}
  ? Type['__typename'] extends keyof Options['values']
    ? Options['values'][Type['__typename']]
    : GraphQLSimpleReturnResult<Type, Options>
  : never;

export type GraphQLResolverField<
  Type extends keyof Options['types'],
  Options extends GraphQLResolverOptions<any, any, any>,
  Variables,
  ReturnType,
> = (
  value: GraphQLReturnResult<Options['types'][Type], Options>,
  variables: Variables,
  context: Options['context'],
) =>
  | GraphQLReturnResult<ReturnType, Options>
  | Promise<GraphQLReturnResult<ReturnType, Options>>;

export type GraphQLResolver<
  Type extends keyof Options['types'],
  Options extends GraphQLResolverOptions<any, any, any>,
> = {
  [Field in keyof Options['types'][Type]]?: Options['types'][Type][Field] extends (
    variables: infer Variables,
  ) => infer ReturnValue
    ? GraphQLResolverField<Type, Options, Variables, ReturnValue>
    : never;
};
