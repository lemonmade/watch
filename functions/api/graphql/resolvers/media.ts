import type {
  Series as DatabaseSeries,
  Season as DatabaseSeason,
  Episode as DatabaseEpisode,
} from '@prisma/client';

import type {Resolver, QueryResolver, MutationResolver} from './types';
import {toGid, fromGid} from './utilities/id';
import {bufferFromSlice} from './utilities/slices';
import type {Slice} from './utilities/slices';

import {
  Series as SeriesLists,
  Season as SeasonLists,
  Episode as EpisodeLists,
} from './lists';
import {Series as SeriesSubscription} from './subscriptions';
import {Series as SeriesWatchLater} from './watch-later';
import {
  Series as SeriesWatches,
  Season as SeasonWatches,
  Episode as EpisodeWatches,
} from './watches';

declare module './types' {
  export interface GraphQLTypeMap {
    Series: DatabaseSeries;
    Season: DatabaseSeason;
    Episode: DatabaseEpisode;
    EpisodeSlice: Slice;
  }
}

export type SeriesResolver = Resolver<'Series'>;
export type SeasonResolver = Resolver<'Season'>;
export type EpisodeResolver = Resolver<'Episode'>;

export const Query: Pick<QueryResolver, 'series'> = {
  series(_, {id}, {prisma}) {
    return prisma.series.findFirst({where: {id: fromGid(id).id}});
  },
};

export const Series: SeriesResolver = {
  id: ({id}) => toGid(id, 'Series'),
  season({id}, {number}, {prisma}) {
    return prisma.season.findFirst({where: {seriesId: id, number}});
  },
  seasons({id}, _, {prisma}) {
    return prisma.season.findMany({where: {seriesId: id}});
  },
  episode({id}, {number, seasonNumber}, {prisma}) {
    return prisma.episode.findFirst({
      where: {number, season: {number: seasonNumber, seriesId: id}},
    });
  },
  episodes({id}, _, {prisma}) {
    return prisma.episode.findMany({
      take: 50,
      where: {season: {seriesId: id}},
    });
  },
  poster({posterUrl}) {
    return posterUrl ? {source: posterUrl} : null;
  },
  ...SeriesLists,
  ...SeriesWatches,
  ...SeriesWatchLater,
  ...SeriesSubscription,
};

export const Season: SeasonResolver = {
  id: ({id}) => toGid(id, 'Season'),
  series({seriesId}, _, {prisma}) {
    return prisma.series.findFirst({
      where: {id: seriesId},
      rejectOnNotFound: true,
    });
  },
  async episodes({id}, _, {prisma}) {
    const episodes = await prisma.episode.findMany({
      where: {seasonId: id},
      orderBy: {number: 'asc'},
    });

    return episodes;
  },
  poster({posterUrl}) {
    return posterUrl ? {source: posterUrl} : null;
  },
  isSpecials({number}) {
    return number === 0;
  },
  ...SeasonLists,
  ...SeasonWatches,
};

export const Episode: EpisodeResolver = {
  id: ({id}) => toGid(id, 'Episode'),
  async series({seasonId}, _, {prisma}) {
    const foundSeason = await prisma.season.findFirst({
      where: {id: seasonId},
      select: {series: true},
      rejectOnNotFound: true,
    });

    return foundSeason.series;
  },
  season({seasonId}, _, {prisma}) {
    return prisma.season.findFirst({
      where: {id: seasonId},
      rejectOnNotFound: true,
    });
  },
  still({stillUrl}) {
    return stillUrl ? {source: stillUrl} : null;
  },
  ...EpisodeWatches,
  ...EpisodeLists,
};

export const Mutation: Pick<MutationResolver, 'updateSeason'> = {
  // Should be gated on permissions, and should update watchthroughs async
  async updateSeason(_, {id: gid, status}, {prisma}) {
    const {id} = fromGid(gid);
    const season = await prisma.season.update({
      where: {id},
      data: {status: status ?? undefined},
    });

    if (status === 'ENDED') {
      const watchThroughs = await prisma.watchThrough.findMany({
        where: {
          to: bufferFromSlice({season: season.number}),
          current: bufferFromSlice({
            season: season.number,
            episode: season.episodeCount + 1,
          }),
          seriesId: season.seriesId,
          status: 'ONGOING',
        },
        include: {user: {select: {id: true}}},
      });

      await Promise.all([
        prisma.watchThrough.updateMany({
          where: {
            id: {in: watchThroughs.map(({id}) => id)},
          },
          data: {
            status: 'FINISHED',
            current: null,
          },
        }),
        prisma.watch.createMany({
          data: watchThroughs.map<
            import('@prisma/client').Prisma.WatchCreateManyInput
          >(({id, userId}) => {
            return {
              userId,
              seasonId: season.id,
              watchThroughId: id,
            };
          }),
        }),
      ]);

      await prisma.watchThrough.updateMany({
        where: {
          to: bufferFromSlice({season: season.number}),
          current: bufferFromSlice({
            season: season.number,
            episode: season.episodeCount + 1,
          }),
          seriesId: season.seriesId,
          status: 'ONGOING',
        },
        data: {
          status: 'FINISHED',
          current: null,
        },
      });
    }

    return {season};
  },
};
