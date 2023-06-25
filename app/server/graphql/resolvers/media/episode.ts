import type {Episode as DatabaseEpisode} from '@prisma/client';

import {type Slice} from '~/global/slices.ts';

import type {Resolver, QueryResolver} from '../types.ts';
import {toGid, fromGid} from '../shared/id.ts';
import {imageUrl} from '../shared/images.ts';

import {Episode as EpisodeLists} from '../lists.ts';
import {Episode as EpisodeWatches} from '../watches.ts';
import {EpisodeSelection} from '@watching/api';

declare module '../types.ts' {
  export interface ValueMap {
    Episode: DatabaseEpisode;
    EpisodeSlice: Slice;
  }
}

export type EpisodeResolver = Resolver<'Episode'>;

export const Query: Pick<QueryResolver, 'episode'> = {
  episode(_, {id, series, season, number}, {prisma}) {
    if (id) {
      return prisma.episode.findFirst({
        where: {id: fromGid(id).id},
      });
    } else if (series && season != null && number != null) {
      const {handle, id: seriesId} = series;
      const seriesOption = handle
        ? {series: {handle}}
        : seriesId
        ? {seriesId}
        : {};

      return prisma.episode.findFirst({
        where: {number, seasonNumber: season, ...seriesOption},
      });
    }

    throw new Error(
      `You must provide either an 'id' or 'series' and 'number' variables`,
    );
  },
};

export const Episode: EpisodeResolver = {
  id: ({id}) => toGid(id, 'Episode'),
  selector({number, seasonNumber}) {
    return EpisodeSelection.stringify({episode: number, season: seasonNumber});
  },
  series({seriesId}, _, {prisma}) {
    return prisma.series.findFirstOrThrow({
      where: {id: fromGid(seriesId).id},
    });
  },
  season({seasonId}, _, {prisma}) {
    return prisma.season.findFirstOrThrow({
      where: {id: seasonId},
    });
  },
  still({stillUrl}) {
    return stillUrl ? {source: imageUrl(stillUrl, {width: 1_000})} : null;
  },
  async hasAired({firstAired, seasonId}, _, {prisma}) {
    if (firstAired != null) {
      return firstAired.getTime() < Date.now();
    }

    const season = await prisma.season.findFirstOrThrow({
      where: {id: seasonId},
    });

    return season.status !== 'CONTINUING';
  },
  ...EpisodeWatches,
  ...EpisodeLists,
};
