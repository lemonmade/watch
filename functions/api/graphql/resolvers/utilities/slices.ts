export interface Slice {
  season: number;
  episode?: number | null;
}

export function bufferFromSlice(slice: Slice) {
  return slice.episode == null
    ? Buffer.from([slice.season])
    : Buffer.from([slice.season, slice.episode]);
}

export function sliceFromBuffer(buffer: Buffer): Slice {
  const sliceArray = new Uint8Array(buffer);
  return sliceArray.length === 1
    ? {season: sliceArray[0]!}
    : {season: sliceArray[0]!, episode: sliceArray[1]};
}
