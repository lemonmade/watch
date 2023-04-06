import type {
  GraphQLResolver,
  GraphQLResolverOptions,
  GraphQLBaseResolverValueMap,
} from '@watching/graphql/server';

import type {Context} from '../context.ts';
import type {Schema} from '../schema.ts';

export type {Context};

export interface ValueMap extends GraphQLBaseResolverValueMap {}

export type ResolverOptions = GraphQLResolverOptions<Schema, ValueMap, Context>;

export type Resolver<Type extends keyof ResolverOptions['types']> =
  GraphQLResolver<Type, ResolverOptions>;

export type QueryResolver = Resolver<'Query'>;
export type MutationResolver = Resolver<'Mutation'>;

export interface InterfaceResolver {
  __resolveType(value: unknown): string;
}

export interface UnionResolver {
  __resolveType(value: unknown): string;
}
