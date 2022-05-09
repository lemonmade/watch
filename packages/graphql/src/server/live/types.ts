export type GraphQLNullableFields<Type> = {
  [Field in keyof Type]: ((...args: any[]) => null) extends Type[Field]
    ? Field
    : never;
}[keyof Type];

export type GraphQLLiveResolverObject<
  Type,
  Context = Record<string, never>,
> = PickPartial<
  {
    [Field in keyof Type]: Field extends '__typename'
      ? Type[Field]
      : Type[Field] extends (variables: infer Variables) => infer ReturnValue
      ? GraphQLLiveResolverField<Variables, ReturnValue, Context>
      : never;
  },
  GraphQLNullableFields<Type>
>;

export interface GraphQLLiveResolverFieldOptions {
  readonly signal: AbortSignal;
}

export type GraphQLLiveResolverField<
  Variables,
  ReturnType,
  Context = Record<string, never>,
> =
  | GraphQLLiveReturnResult<ReturnType, Context>
  | ((
      variables: Variables,
      context: Context,
      options: GraphQLLiveResolverFieldOptions,
    ) =>
      | GraphQLLiveReturnResult<ReturnType, Context>
      | Promise<GraphQLLiveReturnResult<ReturnType, Context>>
      | IterableIterator<GraphQLLiveReturnResult<ReturnType, Context>>
      | AsyncIterableIterator<GraphQLLiveReturnResult<ReturnType, Context>>);

export type GraphQLLiveSimpleReturnResult<
  Type,
  Context = Record<string, never>,
> = {
  [Field in Exclude<keyof Type, '__typename'>]: Type[Field] extends (
    variables: any,
  ) => infer ReturnValue
    ? GraphQLLiveReturnResult<ReturnValue, Context>
    : never;
};

export type GraphQLLiveReturnResult<
  Type,
  Context = Record<string, never>,
> = Type extends null
  ? null
  : Type extends number
  ? Type
  : Type extends string
  ? Type
  : Type extends boolean
  ? Type
  : Type extends (infer U)[]
  ? GraphQLLiveReturnResult<U, Context>[]
  : Type extends {__possibleTypes: any}
  ? GraphQLLiveReturnResult<Type['__possibleTypes'], Context>
  : Type extends {__typename: any}
  ? GraphQLLiveResolverObject<Type, Context>
  : never;

export interface GraphQLLiveResolverCreateHelper<
  Types,
  Context = Record<string, never>,
> {
  object<Type extends keyof Types>(
    type: Type,
    resolver: Omit<
      GraphQLLiveResolverObject<Types[Type], Context>,
      '__typename'
    >,
  ): GraphQLLiveResolverObject<Types[Type], Context>;
}

export type PickPartial<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
