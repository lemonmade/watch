import type {Watch as DatabaseWatch} from '@prisma/client';

import {toGid, fromGid} from '../shared/id.ts';
import {
  addResolvedType,
  createResolver,
  createQueryResolver,
  createMutationResolver,
  createResolverWithGid,
  createUnionResolver,
  createInterfaceResolver,
} from '../shared/resolvers.ts';

import {VIRTUAL_WATCH_LATER_LIST} from '../lists.ts';

import {updateWatchThrough} from './shared.ts';

declare module '../types' {
  export interface ValueMap {
    Watch: DatabaseWatch;
  }
}

export const Query = createQueryResolver({
  watch(_, {id}, {prisma, user}) {
    return prisma.watch.findFirst({
      where: {id: fromGid(id).id, userId: user.id},
    });
  },
});

export const Mutation = createMutationResolver({
  async watchEpisode(
    _,
    {
      episode: episodeGid,
      watchThrough: watchThroughGid,
      rating,
      notes,
      startedAt,
      finishedAt,
      updateWatchLater = true,
    },
    {prisma, user},
  ) {
    const episodeId = fromGid(episodeGid).id;
    const watchThroughId = watchThroughGid && fromGid(watchThroughGid).id;

    const validatedWatchThroughId = watchThroughId
      ? (
          await prisma.watchThrough.findFirst({
            where: {id: watchThroughId, userId: user.id},
            rejectOnNotFound: true,
          })
        ).id
      : undefined;

    const {episode, ...watch} = await prisma.watch.create({
      data: {
        episodeId,
        watchThroughId: validatedWatchThroughId,
        rating,
        notes: notes?.content,
        containsSpoilers: notes?.containsSpoilers,
        startedAt,
        finishedAt,
        userId: user.id,
      },
      include: {
        episode: {
          include: {season: {select: {seriesId: true}}},
        },
      },
    });

    const watchLater = await prisma.list.findFirst({
      where: {watchLaterUser: {id: user.id}},
    });

    if (updateWatchLater && watchLater) {
      await prisma.listItem.deleteMany({
        where: {listId: watchLater.id, seriesId: episode!.season.seriesId},
      });
    }

    let watchThrough: import('@prisma/client').WatchThrough | undefined;

    if (validatedWatchThroughId) {
      watchThrough = await updateWatchThrough(validatedWatchThroughId, {
        prisma,
        watch,
        episode: episode!,
      });
    }

    return {
      watch,
      episode,
      watchThrough: watchThrough ?? null,
      watchLater: watchLater ?? VIRTUAL_WATCH_LATER_LIST,
    };
  },
  async watchEpisodesFromSeries(
    _,
    {series: seriesGid, from, to, updateWatchLater = true},
    {user, prisma},
  ) {
    const {id} = fromGid(seriesGid);

    const series = await prisma.series.findFirst({
      where: {id},
      include: {
        seasons: {
          where:
            from || to
              ? {
                  number: {gte: from?.season, lte: to?.season},
                }
              : undefined,
          select: {
            id: true,
            number: true,
            status: true,
            episodes: {
              select: {id: true, number: true},
              orderBy: {number: 'asc'},
            },
          },
        },
      },
      rejectOnNotFound: true,
    });

    await prisma.watch.createMany({
      data: series.seasons.flatMap<
        import('@prisma/client').Prisma.WatchCreateManyInput
      >((season) => {
        let matchingEpisodes = season.episodes;

        if (from?.episode && from.season === season.number) {
          matchingEpisodes = matchingEpisodes.filter(
            (episode) => episode.number >= from.episode!,
          );
        }

        if (to?.episode && to.season === season.number) {
          matchingEpisodes = matchingEpisodes.filter(
            (episode) => episode.number <= to.episode!,
          );
        }

        const finishedSeason =
          season.status === 'ENDED' &&
          matchingEpisodes[matchingEpisodes.length - 1]?.id ===
            season.episodes[season.episodes.length - 1]?.id;

        return [
          ...matchingEpisodes.map(
            (
              episode,
            ): import('@prisma/client').Prisma.WatchCreateManyInput => ({
              userId: user.id,
              episodeId: episode.id,
            }),
          ),
          ...(finishedSeason ? [{userId: user.id, seasonId: season.id}] : []),
        ];
      }),
    });

    const watchLater = await prisma.list.findFirst({
      where: {watchLaterUser: {id: user.id}},
    });

    if (updateWatchLater && watchLater) {
      await prisma.listItem.deleteMany({
        where: {listId: watchLater.id, seriesId: series.id},
      });
    }

    return {
      series,
      watchLater: watchLater ?? VIRTUAL_WATCH_LATER_LIST,
    };
  },
  async deleteWatch(_, {id: gid}, {user, prisma}) {
    const {id} = fromGid(gid);

    const validatedWatch = await prisma.watch.findFirst({
      where: {id, userId: user.id},
      select: {id: true},
      rejectOnNotFound: true,
    });

    // We should be making sure we don’t need to reset the `nextEpisode`
    // field...
    const {watchThrough} = await prisma.watch.delete({
      where: {id: validatedWatch.id},
      include: {watchThrough: true},
    });

    return {
      deletedWatchId: toGid(validatedWatch.id, 'Watch'),
      watchThrough,
    };
  },
});

export const Watch = createResolverWithGid('Watch', {
  async media({id, episodeId, seasonId}, _, {prisma}) {
    const [episode, season] = await Promise.all([
      episodeId
        ? prisma.episode.findFirst({
            where: {id: episodeId},
          })
        : Promise.resolve(null),
      seasonId
        ? prisma.season.findFirst({
            where: {id: seasonId},
            rejectOnNotFound: true,
          })
        : Promise.resolve(null),
    ]);

    if (episode) {
      return addResolvedType('Episode', episode);
    } else if (season) {
      return addResolvedType('Season', season);
    } else {
      throw new Error(`Could not parse the media for watch ${id}`);
    }
  },
  watchThrough({watchThroughId}, _, {prisma, user}) {
    return watchThroughId
      ? prisma.watchThrough.findFirst({
          where: {id: watchThroughId, userId: user.id},
          rejectOnNotFound: true,
        })
      : null;
  },
  notes({containsSpoilers, notes}) {
    return notes == null ? null : {content: notes, containsSpoilers};
  },
});

export const Action = createUnionResolver();

export const Watchable = createInterfaceResolver();

export const Season = createResolver('Season', {
  watches({id}, _, {prisma, user}) {
    return prisma.watch.findMany({
      where: {seasonId: id, userId: user.id},
      take: 50,
    });
  },
  latestWatch({id}, __, {prisma, user}) {
    return prisma.watch.findFirst({
      where: {seasonId: id, userId: user.id},
      orderBy: {finishedAt: 'desc', startedAt: 'desc', createdAt: 'desc'},
    });
  },
});

export const Episode = createResolver('Episode', {
  watches({id}, _, {prisma, user}) {
    return prisma.watch.findMany({
      where: {episodeId: id, userId: user.id},
      take: 50,
    });
  },
  latestWatch({id}, _, {prisma, user}) {
    return prisma.watch.findFirst({
      where: {episodeId: id, userId: user.id},
      orderBy: {finishedAt: 'desc', startedAt: 'desc', createdAt: 'desc'},
    });
  },
});
