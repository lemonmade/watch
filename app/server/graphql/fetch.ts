import type {ExecutionResult} from 'graphql';
import {
  toGraphQLSource,
  type GraphQLAnyOperation,
} from '@quilted/quilt/graphql';
import type {Context} from './context.ts';

export async function fetchGraphQL<Data, Variables>(
  operation: GraphQLAnyOperation<Data, Variables>,
  {
    context,
    variables = {} as any,
    operationName,
  }: {
    context: Context;
    variables?: Variables;
    operationName?: string;
  },
) {
  const [schema, {graphql}] = await Promise.all([
    loadSchema(),
    import('graphql'),
  ]);

  const source = toGraphQLSource(operation);
  const finalOperationName = operationName ?? (operation as any).name;

  const result = await graphql({
    schema,
    source,
    operationName: finalOperationName,
    variableValues: variables as Record<any, any>,
    contextValue: context,
  });

  return result as ExecutionResult<Data>;
}

let schemaPromise: Promise<import('graphql').GraphQLSchema>;

function loadSchema() {
  schemaPromise ??= (async () => {
    const [{createGraphQLSchema}, resolvers, {default: schemaSource}] =
      await Promise.all([
        import('@quilted/quilt/graphql/server'),
        import('./resolvers.ts'),
        import('./schema.ts'),
      ]);

    return createGraphQLSchema(schemaSource, resolvers);
  })();

  return schemaPromise;
}
