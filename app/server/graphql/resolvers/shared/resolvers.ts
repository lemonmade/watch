import type {
  Resolver,
  Resolvers,
  ResolverContext,
  QueryResolver,
  MutationResolver,
  ResolverOptions,
  InterfaceResolver,
  UnionResolver,
} from '../types.ts';

import {fromGid, toGid} from './id.ts';

export type {
  Resolver,
  Resolvers,
  ResolverContext,
  QueryResolver,
  MutationResolver,
  InterfaceResolver,
  UnionResolver,
};

export function createResolver<Type extends keyof ResolverOptions['types']>(
  _type: Type,
  resolver: Resolver<Type>,
) {
  return resolver;
}

export function createResolverWithGid<
  Type extends keyof ResolverOptions['types'],
>(type: Type, resolver: Resolver<Type>) {
  return {id: ({id}: {id: string}) => toGid(id, type), ...resolver};
}

export function createQueryResolver<Fields extends keyof QueryResolver>(
  resolver: Pick<QueryResolver, Fields>,
) {
  return resolver;
}

export function createMutationResolver<Fields extends keyof MutationResolver>(
  resolver: Pick<MutationResolver, Fields>,
) {
  return resolver;
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
