import type {
  Series as DatabaseSeries,
  Season as DatabaseSeason,
  Episode as DatabaseEpisode,
} from '@prisma/client';

import {updateSeries} from '~/global/tmdb.ts';
import {bufferFromSlice, type Slice} from '~/global/slices.ts';

import type {Resolver, QueryResolver, MutationResolver} from './types.ts';
import {toGid, fromGid} from './shared/id.ts';
import {toHandle} from './shared/handle.ts';
import {imageUrl} from './shared/images.ts';

import {
  Series as SeriesLists,
  Season as SeasonLists,
  Episode as EpisodeLists,
} from './lists.ts';
import {Series as SeriesSubscription} from './subscriptions.ts';
import {Series as SeriesApp} from './apps.ts';
import {Series as SeriesWatchLater} from './watch-later.ts';
import {
  Series as SeriesWatches,
  Season as SeasonWatches,
  Episode as EpisodeWatches,
} from './watches.ts';

declare module './types.ts' {
  export interface ValueMap {
    Series: DatabaseSeries;
    Season: DatabaseSeason;
    Episode: DatabaseEpisode;
    EpisodeSlice: Slice;
  }
}

export type SeriesResolver = Resolver<'Series'>;
export type SeasonResolver = Resolver<'Season'>;
export type EpisodeResolver = Resolver<'Episode'>;

export const Query: Pick<QueryResolver, 'series' | 'randomSeries'> = {
  series(_, {id, handle}, {prisma}) {
    if (id) {
      return prisma.series.findFirst({
        where: {id: fromGid(id).id},
        rejectOnNotFound: false,
      });
    } else if (handle) {
      return prisma.series.findFirst({
        where: {handle},
        rejectOnNotFound: false,
      });
    }

    throw new Error(`You must provide either an 'id' or 'handle'`);
  },
  randomSeries(_, __, {prisma}) {
    // TODO: make it more random
    return prisma.series.findFirst({
      rejectOnNotFound: true,
    });
  },
};

export const Series: SeriesResolver = {
  id: ({id}) => toGid(id, 'Series'),
  handle: ({name, handle}) => handle ?? toHandle(name),
  imdbUrl({imdbId}) {
    return imdbId && `https://www.imdb.com/title/${imdbId}`;
  },
  tmdbUrl({tmdbId}) {
    return `https://www.themoviedb.org/tv/${tmdbId}`;
  },
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
    return posterUrl ? {source: imageUrl(posterUrl, {width: 300})} : null;
  },
  ...SeriesLists,
  ...SeriesWatches,
  ...SeriesWatchLater,
  ...SeriesSubscription,
  ...SeriesApp,
};

export const Season: SeasonResolver = {
  id: ({id}) => toGid(id, 'Season'),
  series({seriesId}, _, {prisma}) {
    return prisma.series.findFirst({
      where: {id: seriesId},
      rejectOnNotFound: true,
    });
  },
  async tmdbUrl({seriesId, number}, _, {prisma}) {
    const series = await prisma.series.findFirst({
      where: {id: seriesId},
      select: {tmdbId: true},
      rejectOnNotFound: true,
    });

    return `https://www.themoviedb.org/tv/${series.tmdbId}/season/${number}`;
  },
  async imdbUrl({seriesId, number}, _, {prisma}) {
    const series = await prisma.series.findFirst({
      where: {id: seriesId},
      select: {imdbId: true},
      rejectOnNotFound: true,
    });

    return `https://www.imdb.com/title/${series.imdbId}/episodes?season=${number}`;
  },
  async episodes({id}, _, {prisma}) {
    const episodes = await prisma.episode.findMany({
      where: {seasonId: id},
      orderBy: {number: 'asc'},
    });

    return episodes;
  },
  poster({posterUrl}) {
    return posterUrl ? {source: imageUrl(posterUrl, {width: 300})} : null;
  },
  isSpecials({number}) {
    return number === 0;
  },
  isUpcoming({status, firstAired}) {
    return (
      status === 'CONTINUING' &&
      (firstAired == null || Date.now() < firstAired.getTime())
    );
  },
  isCurrentlyAiring({status, firstAired}) {
    return (
      status === 'CONTINUING' &&
      firstAired != null &&
      Date.now() > firstAired.getTime()
    );
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

export const Mutation: Pick<
  MutationResolver,
  'updateSeason' | 'deleteSeries' | 'synchronizeSeriesWithTmdb'
> = {
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
  async deleteSeries(_, {id: gid}, {prisma}) {
    const {id} = fromGid(gid);
    await prisma.series.delete({where: {id}});
    return {deletedId: gid};
  },
  async synchronizeSeriesWithTmdb(_, {id: gid}, {prisma}) {
    const {id} = fromGid(gid);
    const {tmdbId, name} = await prisma.series.findFirstOrThrow({where: {id}});
    const {series} = await updateSeries({id, name, tmdbId, prisma});
    return {series};
  },
};
