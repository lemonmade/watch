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
  Fields extends keyof Resolvers[Type],
>(type: Type, resolver: Required<Pick<Resolvers[Type], Fields>>) {
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

export function addResolvedType<T extends object>(type: string, object: T) {
  return {...object, [RESOLVED_TYPE]: type};
}

function resolveType(obj: {[RESOLVED_TYPE]?: string; id: string}) {
  return obj[RESOLVED_TYPE] ?? fromGid(obj.id).type;
}
