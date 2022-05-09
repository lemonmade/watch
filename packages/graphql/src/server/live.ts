import {EventEmitter, on} from 'events';

import type {
  DocumentNode,
  SelectionNode,
  FieldNode,
  OperationDefinitionNode,
  FragmentDefinitionNode,
} from 'graphql';
import type {GraphQLLiveResolverObject} from '.';

export function createObjectType<
  Types,
  Context = Record<string, never>,
  Type extends keyof Types = keyof Types,
>(
  type: Type,
  resolver: Omit<GraphQLLiveResolverObject<Types[Type], Context>, '__typename'>,
): GraphQLLiveResolverObject<Types[Type], Context> {
  return {__typename: type, ...resolver} as any;
}

export interface GraphQLLiveQueryResolverCreateHelper<
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

export function createQueryResolver<
  Types extends {Query: {__typename: 'Query'}},
  Context = Record<string, never>,
>(
  createResolvers: (
    helpers: GraphQLLiveQueryResolverCreateHelper<Types, Context>,
  ) => Omit<GraphQLLiveResolverObject<Types['Query'], Context>, '__typename'>,
): GraphQLLiveResolverObject<Types['Query'], Context> {
  const resolvers = createResolvers({
    object: createObjectType as any,
  });

  return {__typename: 'Query', ...resolvers} as any;
}

interface GraphQLLiveField {
  value: any;
  abort: AbortController;
  iterator: AsyncIterableIterator<any>;
}

export function execute<
  Data = Record<string, unknown>,
  Context = Record<string, never>,
  Resolver extends GraphQLLiveResolverObject<
    // eslint-disable-next-line @typescript-eslint/ban-types
    {},
    Context
    // eslint-disable-next-line @typescript-eslint/ban-types
  > = GraphQLLiveResolverObject<{}, Context>,
>(
  document: DocumentNode,
  resolvers: Resolver,
  {
    context = {} as any,
  }: {
    context?: Context;
  } = {},
) {
  let query: OperationDefinitionNode | undefined = undefined;

  const fragmentDefinitions = new Map<string, FragmentDefinitionNode>();

  for (const definition of document.definitions) {
    switch (definition.kind) {
      case 'OperationDefinition': {
        if (query != null || definition.operation !== 'query') continue;
        query = definition;
        break;
      }
      case 'FragmentDefinition': {
        fragmentDefinitions.set(definition.name.value, definition);
        break;
      }
    }
  }

  if (query == null) {
    throw new Error('No query found');
  }

  const emitter = new EventEmitter();

  const liveFields = new Map<string, GraphQLLiveField>();

  const abort = new AbortController();
  const rawResults: Record<string, any> = {};

  let initialPromise: Promise<void>;

  const executionResult = {
    get current(): Data {
      // TODO what to do while first version is loading
      return rawResults as any;
    },
    async untilDone(): Promise<Data> {
      // eslint-disable-next-line no-empty
      for await (const _ of executionResult) {
      }

      return rawResults as any;
    },
    async *[Symbol.asyncIterator](): AsyncGenerator<Data, void, void> {
      initialPromise ??= handleSelection(
        query!.selectionSet.selections,
        resolvers,
        rawResults,
        abort.signal,
      );

      await initialPromise;

      yield rawResults as any;

      if (liveFields.size === 0) return;

      for await (const _ of on(emitter, 'update', {signal: abort.signal})) {
        yield rawResults as any;
        if (liveFields.size === 0) break;
      }
    },
  };

  return executionResult;

  function handleValueForField(
    value: any,
    name: string,
    result: any,
    field: FieldNode,
    signal: AbortSignal,
  ) {
    if (value == null) {
      result[name] = null;
      return;
    }

    if (field.selectionSet != null) {
      if (typeof value !== 'object') {
        throw new Error(
          `Found non-object value for field ${name} with selection ${field.selectionSet.selections}`,
        );
      }

      const {selections} = field.selectionSet;

      if (Array.isArray(value)) {
        const nestedResults = value.map(() => ({}));
        result[name] = nestedResults;

        return Promise.all(
          value.map((arrayValue, index) =>
            handleSelection(
              selections,
              arrayValue,
              nestedResults[index]!,
              signal,
            ),
          ),
        );
      }

      const nestedResult: Record<string, any> = {};
      result[name] = nestedResult;

      return handleSelection(
        field.selectionSet.selections,
        value,
        nestedResult,
        signal,
      );
    }

    // TODO: check this isn’t an object
    result[name] = value;
  }

  async function handleSelection(
    selections: readonly SelectionNode[],
    resolvers: GraphQLLiveResolverObject<any, Context>,
    result: Record<string, any>,
    signal: AbortSignal,
  ) {
    await Promise.all(
      selections.map(async (selection) => {
        switch (selection.kind) {
          case 'Field': {
            const name = selection.name.value;
            const alias = selection.alias?.value;
            const fieldName = alias ?? name;
            const valueOrResolver = (resolvers as any)[name];

            if (typeof valueOrResolver !== 'function') {
              return handleValueForField(
                valueOrResolver,
                fieldName,
                result,
                selection,
                signal,
              );
            }

            // TODO
            const resolverResult = valueOrResolver({}, context);

            if (resolverResult == null || typeof resolverResult !== 'object') {
              return handleValueForField(
                resolverResult,
                fieldName,
                result,
                selection,
                signal,
              );
            }

            if (typeof (resolverResult as any).then === 'function') {
              return (async () => {
                const value = await resolverResult;

                if (signal.aborted) return;

                await handleValueForField(
                  value,
                  fieldName,
                  result,
                  selection,
                  signal,
                );
              })();
            }

            if (typeof (resolverResult as any).next === 'function') {
              const iterator = resolverResult as AsyncIterableIterator<any>;

              let abort = new NestedAbortController(signal);
              const liveField: GraphQLLiveField = {
                value: null,
                iterator,
                abort,
              };

              liveFields.set(name, liveField);

              const listenForUpdates =
                async function listenForUpdates(): Promise<void> {
                  try {
                    const {value, done = false} = await iterator.next();

                    if (abort.signal.aborted) return;

                    if (done) {
                      liveFields.delete(name);
                      return;
                    }

                    abort.abort();
                    abort = new NestedAbortController(signal);
                    liveField.abort = abort;

                    // TODO don’t want fields within here to emit in this phase...
                    await handleValueForField(
                      value,
                      fieldName,
                      result,
                      selection,
                      abort.signal,
                    );

                    emitter.emit('update');

                    await listenForUpdates();
                  } catch {
                    // TODO: what do I do here...
                  }
                };

              const iteratorResult = iterator.next();

              return (async () => {
                const {value, done = false} = await iteratorResult;
                if (signal.aborted) return;

                if (done) {
                  liveFields.delete(name);
                } else {
                  listenForUpdates();
                }

                await handleValueForField(
                  value,
                  fieldName,
                  result,
                  selection,
                  abort.signal,
                );
              })();
            }

            await handleValueForField(
              resolverResult,
              fieldName,
              result,
              selection,
              signal,
            );

            break;
          }
          case 'InlineFragment': {
            if (
              selection.typeCondition != null &&
              selection.typeCondition.name.value !==
                (resolvers as any)['__typename']
            ) {
              break;
            }

            await handleSelection(
              selection.selectionSet.selections,
              resolvers,
              result,
              signal,
            );

            break;
          }
          case 'FragmentSpread': {
            const name = selection.name.value;
            const fragment = fragmentDefinitions.get(name);

            if (fragment == null) {
              throw new Error(`Missing fragment: ${name}`);
            }

            if (
              fragment.typeCondition.name.value !==
              (resolvers as any)['__typename']
            ) {
              break;
            }

            await handleSelection(
              fragment.selectionSet.selections,
              resolvers,
              result,
              signal,
            );

            break;
          }
        }
      }),
    );
  }
}

class NestedAbortController extends AbortController {
  constructor(parent: AbortSignal) {
    super();

    parent.addEventListener('abort', () => {
      this.abort();
    });
  }
}
