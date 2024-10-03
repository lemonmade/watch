import {createGraphQLResolverBuilder} from '@quilted/graphql/server';
import type {
  Schema,
  Resolver,
  Resolvers,
  ResolverContext,
  QueryResolver,
  MutationResolver,
  InterfaceResolver,
  UnionResolver,
  GraphQLValues,
} from '../types.ts';

import {fromGid, toGid} from './id.ts';

export type {
  Schema,
  Resolver,
  Resolvers,
  ResolverContext,
  QueryResolver,
  MutationResolver,
  InterfaceResolver,
  UnionResolver,
  GraphQLValues,
};

const {createResolver, createQueryResolver, createMutationResolver} =
  createGraphQLResolverBuilder<Schema, GraphQLValues, ResolverContext>();

export {createResolver, createQueryResolver, createMutationResolver};

export function createResolverWithGid<
  Type extends keyof Resolvers,
  Resolver extends Partial<Resolvers[Type]>,
>(type: Type, resolver: Resolver): Resolver & {id: (arg: any) => string} {
  return {id: ({id}: {id: string}) => toGid(id, type), ...resolver};
}

export function createInterfaceResolver(): InterfaceResolver {
  return {
    __resolveType: resolveType,
  };
}

export function createUnionResolver(): UnionResolver {
  return {
    __resolveType: resolveType,
  };
}

const RESOLVED_TYPE = Symbol.for('watch.resolved-type');

export function addResolvedType<T extends object>(type: string, object: T): T {
  return {...object, [RESOLVED_TYPE]: type};
}

function resolveType(obj: any) {
  return obj[RESOLVED_TYPE] ?? fromGid(obj.id).type;
}
