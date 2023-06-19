import {useGraphQLQuery, useGraphQLMutation} from '@quilted/react-query';

export {useGraphQLQuery as useQuery, useGraphQLMutation as useMutation};

export type PickTypename<
  Type extends {__typename: string},
  Typename extends Type['__typename'],
> = Extract<Type, {__typename: Typename}>;

export type ListItemType<T> = T extends readonly (infer U)[] ? U : never;

const GID_REGEXP = /gid:\/\/watch\/(?<type>\w+)\/(?<id>[\w-]+)/;

export function parseGid(gid: string): {type: string; id: string} {
  const {type, id} = gid.match(GID_REGEXP)?.groups ?? {};

  if (type && id) return {type, id};

  throw new Error(`Invalid gid: ${gid}`);
}
