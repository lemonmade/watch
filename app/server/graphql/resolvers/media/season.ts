import type {Season as DatabaseSeason} from '@prisma/client';

import {bufferFromSlice} from '~/global/slices.ts';

import type {Resolver, QueryResolver, MutationResolver} from '../types.ts';
import {toGid, fromGid} from '../shared/id.ts';
import {imageUrl} from '../shared/images.ts';

import {Season as SeasonLists} from '../lists.ts';
import {Season as SeasonWatches} from '../watches.ts';
import {EpisodeSelection} from '@watching/api';

declare module '../types.ts' {
  export interface ValueMap {
    Season: DatabaseSeason;
  }
}

export type SeasonResolver = Resolver<'Season'>;

export const Query: Pick<QueryResolver, 'season'> = {
  season(_, {id, series, number, selector}, {prisma}) {
    if (id) {
      return prisma.season.findFirst({
        where: {id: fromGid(id).id},
      });
    } else if (series) {
      const {handle, id: seriesId} = series;
      const seriesOption = handle
        ? {series: {handle}}
        : seriesId
        ? {seriesId}
        : {};

      if (number != null) {
        return prisma.season.findFirst({
          where: {number, ...seriesOption},
        });
      } else if (selector != null) {
        const {season} = EpisodeSelection.parse(selector);

        if (season == null) {
          throw new Error(
            `Invalid season selector: ${JSON.stringify(selector)}}`,
          );
        }

        return prisma.season.findFirst({
          where: {number: season, ...seriesOption},
        });
      }
    }

    throw new Error(
      `You must provide either an 'id' or 'series' and 'number' variables`,
    );
  },
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
};
