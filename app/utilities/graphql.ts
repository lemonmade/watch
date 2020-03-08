const GID_REGEXP = /gid:\/\/watch\/(?<type>\w+)\/(?<id>[\w-]+)/;

export function parseGid(gid: string): {type: string; id: string} {
  const {type, id} = gid.match(GID_REGEXP)?.groups ?? {};

  if (type && id) return {type, id};

  throw new Error(`Invalid gid: ${gid}`);
}
