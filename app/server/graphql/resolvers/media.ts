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
import {
  EpisodeSelection,
  type EpisodeSelector,
  type SeasonSelector,
} from '@watching/api';

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

export const Query: Pick<QueryResolver, 'series' | 'season' | 'randomSeries'> =
  {
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
    season(_, {id}, {prisma}) {
      return prisma.season.findFirstOrThrow({
        where: {id: fromGid(id).id},
      });
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
  season({id}, {selector, number}, {prisma}) {
    let seasonNumber = number;

    if (selector) {
      seasonNumber = EpisodeSelection.parse(selector as SeasonSelector).season;
    }

    if (seasonNumber == null) {
      throw new Error(
        `You must provide either a 'selector' variable or 'number' variable`,
      );
    }

    return prisma.season.findFirst({
      where: {seriesId: id, number: seasonNumber},
    });
  },
  seasons({id}, _, {prisma}) {
    return prisma.season.findMany({where: {seriesId: id}});
  },
  episode(
    {id},
    {selector, number, seasonNumber: explicitSeasonNumber},
    {prisma},
  ) {
    let episodeNumber: number | undefined | null;
    let seasonNumber: number | undefined | null;

    if (selector) {
      const parsed = EpisodeSelection.parse(selector as EpisodeSelector);
      episodeNumber = parsed.episode;
      seasonNumber = parsed.season;
    } else {
      episodeNumber = number;
      seasonNumber = explicitSeasonNumber;
    }

    if (episodeNumber == null || seasonNumber == null) {
      throw new Error(
        `You must provide either a 'selector' variable, or 'number' and 'seasonNumber' variables`,
      );
    }

    return prisma.episode.findFirst({
      where: {
        number: episodeNumber,
        seasonNumber,
        seriesId: id,
      },
    });
  },
  episodes({id}, _, {prisma}) {
    return prisma.episode.findMany({
      take: 50,
      where: {seriesId: id},
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
  selector({number}) {
    return EpisodeSelection.stringify({season: number});
  },
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
            nextEpisode: null,
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
