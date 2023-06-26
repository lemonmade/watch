import type {Series as DatabaseSeries} from '@prisma/client';

import {updateSeries} from '~/global/tmdb.ts';

import {
  createQueryResolver,
  createMutationResolver,
  createResolverWithGid,
  type Resolver,
} from '../shared/resolvers.ts';
import {fromGid} from '../shared/id.ts';
import {toHandle} from '../shared/handle.ts';
import {imageUrl} from '../shared/images.ts';

import {Series as SeriesLists} from '../lists.ts';
import {Series as SeriesSubscription} from '../subscriptions.ts';
import {Series as SeriesApp} from '../apps.ts';
import {Series as SeriesWatchLater} from '../watch-later.ts';
import {Series as SeriesWatching} from '../watching.ts';
import {
  EpisodeSelection,
  type EpisodeSelector,
  type SeasonSelector,
} from '@watching/api';

declare module '../types.ts' {
  export interface ValueMap {
    Series: DatabaseSeries;
  }
}

export type SeriesResolver = Resolver<'Series'>;

export const Query = createQueryResolver({
  series(_, {id, handle}, {prisma}) {
    if (id) {
      return prisma.series.findFirst({
        where: {id: fromGid(id).id},
      });
    } else if (handle) {
      return prisma.series.findFirst({
        where: {handle},
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
});

export const Mutation = createMutationResolver({
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
});

export const Series = createResolverWithGid('Series', {
  url: ({handle}, _, {request}) =>
    new URL(`/app/series/${handle}`, request.url).href,
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
  episode({id}, {selector, number, season}, {prisma}) {
    let episodeNumber: number | undefined | null;
    let seasonNumber: number | undefined | null;

    if (selector) {
      const parsed = EpisodeSelection.parse(selector as EpisodeSelector);
      episodeNumber = parsed.episode;
      seasonNumber = parsed.season;
    } else {
      episodeNumber = number;
      seasonNumber = season;
    }

    if (episodeNumber == null || seasonNumber == null) {
      throw new Error(
        `You must provide either a 'selector' variable, or 'number' and 'season' variables`,
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
  ...SeriesWatching,
  ...SeriesWatchLater,
  ...SeriesSubscription,
  ...SeriesApp,
});
