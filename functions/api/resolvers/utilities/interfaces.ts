import {fromGid} from './id';

import type {InterfaceResolver} from '../types';

export function addResolvedType(type: string) {
  return <T>(rest: T): T => ({...rest, __resolvedType: type});
}

export function resolveType(obj: {__resolvedType?: string; id: string}) {
  return obj.__resolvedType ?? fromGid(obj.id).type;
}

export function createInterfaceResolver(): InterfaceResolver {
  return {
    __resolveType: resolveType,
  };
}
