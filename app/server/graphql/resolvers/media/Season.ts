import type {Season as DatabaseSeason, Prisma} from '@prisma/client';

import {fromGid} from '../shared/id.ts';
import {imageUrl} from '../shared/images.ts';
import {
  createQueryResolver,
  createMutationResolver,
  createResolverWithGid,
  type Resolver,
} from '../shared/resolvers.ts';

import {Season as SeasonLists} from '../lists.ts';
import {Season as SeasonWatching} from '../watching.ts';
import {EpisodeSelection} from '@watching/api';

declare module '../types.ts' {
  export interface GraphQLValues {
    Season: DatabaseSeason;
  }
}

export type SeasonResolver = Resolver<'Season'>;

export const Query = createQueryResolver({
  season(_, {id, series, number, selector}, {prisma}) {
    if (id) {
      return prisma.season.findUnique({
        where: {id: fromGid(id).id},
      });
    } else if (series) {
      const {handle, id: seriesId} = series;
      const seriesOption = handle
        ? {series: {handle}}
        : seriesId
          ? {seriesId: fromGid(seriesId).id}
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
});

export const Mutation = createMutationResolver({
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
          nextEpisode: EpisodeSelection.stringify({
            season: season.number,
            episode: season.episodeCount + 1,
          }),
          seriesId: season.seriesId,
          status: 'ONGOING',
        },
      });

      await Promise.all([
        // TODO: this should probably be on a queue
        ...watchThroughs.map(async (watchThrough) => {
          await prisma.watchThrough.update({
            where: {id: watchThrough.id},
            data: {
              status: 'FINISHED',
              finishedAt: watchThrough.updatedAt,
              nextEpisode: null,
            },
          });
        }),
        prisma.watch.createMany({
          data: watchThroughs.map<Prisma.WatchCreateManyInput>(
            ({id, userId, updatedAt}) => {
              return {
                userId,
                seasonId: season.id,
                watchThroughId: id,
                finishedAt: updatedAt,
              };
            },
          ),
        }),
      ]);
    }

    return {season};
  },
});

export const Season = createResolverWithGid('Season', {
  selector({number}) {
    return EpisodeSelection.stringify({season: number});
  },
  series({seriesId}, _, {prisma}) {
    return prisma.series.findUniqueOrThrow({
      where: {id: seriesId},
    });
  },
  async tmdbUrl({seriesId, number}, _, {prisma}) {
    const series = await prisma.series.findUniqueOrThrow({
      where: {id: seriesId},
      select: {tmdbId: true},
    });

    return `https://www.themoviedb.org/tv/${series.tmdbId}/season/${number}`;
  },
  async imdbUrl({seriesId, number}, _, {prisma}) {
    const series = await prisma.series.findUniqueOrThrow({
      where: {id: seriesId},
      select: {imdbId: true},
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
  nextSeason({seriesId, number}, _, {prisma}) {
    return prisma.season.findFirst({
      where: {seriesId, number: number + 1},
    });
  },
  ...SeasonLists,
  ...SeasonWatching,
});
