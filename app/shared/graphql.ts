import type {GraphQLFetch, GraphQLCache} from '@quilted/quilt/graphql';

export {useAsyncCacheControl as useGraphQLCacheControl} from '@quilted/quilt/async';
export {
  useGraphQLQuery,
  useGraphQLMutation,
  useGraphQLQueryData,
  useGraphQLQueryRefetchOnMount,
} from '@quilted/quilt/graphql';

declare module '~/shared/context.ts' {
  interface AppContext {
    readonly graphql: {
      readonly fetch: GraphQLFetch;
      readonly cache: GraphQLCache;
    };
  }
}

export type PickTypename<
  Type extends {__typename: string},
  Typename extends Type['__typename'],
> = Extract<Type, {__typename: Typename}>;

export type ListItemType<T> = T extends readonly (infer U)[] ? U : never;

const GID_REGEXP = /gid:\/\/watch\/(?<type>\w+)\/(?<id>[\w-]+)/;

export function toGid(id: string, type: string) {
  return `gid://watch/${type}/${id}`;
}

export function parseGid(gid: string): {type: string; id: string} {
  const {type, id} = gid.match(GID_REGEXP)?.groups ?? {};

  if (type && id) return {type, id};

  throw new Error(`Invalid gid: ${gid}`);
}
