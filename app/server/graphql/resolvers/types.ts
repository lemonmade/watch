import type {
  GraphQLResolver,
  GraphQLQueryResolver,
  GraphQLMutationResolver,
} from '@quilted/quilt/graphql/server';

import type {Context} from '../context.ts';
import type {Schema} from '../schema.ts';

export type {Schema, Context as ResolverContext};

export interface GraphQLValues {}

export type Resolver<Type extends keyof Schema> = GraphQLResolver<
  Schema[Type],
  GraphQLValues,
  Context
>;

export type Resolvers = {
  [Type in keyof Schema]: Resolver<Type>;
};

export type QueryResolver = GraphQLQueryResolver<
  Schema,
  GraphQLValues,
  Context
>;
export type MutationResolver = GraphQLMutationResolver<
  Schema,
  GraphQLValues,
  Context
>;

export interface InterfaceResolver {
  __resolveType(value: unknown): string;
}

export interface UnionResolver {
  __resolveType(value: unknown): string;
}
