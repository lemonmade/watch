export function toGid(id: string, type: string) {
  return `gid://watch/${type}/${id}`;
}

export function fromGid(gid: string) {
  const {type, id} = /gid:\/\/watch\/(?<type>\w+)\/(?<id>[\w-]+)/.exec(
    gid,
  )!.groups!;
  return {type: type!, id: id!};
}
