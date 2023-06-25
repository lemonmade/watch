import type {
  Resolver,
  QueryResolver,
  MutationResolver,
  ResolverOptions,
} from '../types.ts';

import {toGid} from './id.ts';

export type {Resolver, QueryResolver, MutationResolver};

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
