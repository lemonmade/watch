import type {Prisma, Watch as DatabaseWatch} from '@prisma/client';
import {EpisodeSelection} from '@watching/api';

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
import {episodeRangeSelectorObjectFromGraphQLInput} from '../shared/episode-selection.ts';

import {VIRTUAL_WATCH_LATER_LIST} from '../lists.ts';

import {updateWatchThrough} from './shared.ts';

declare module '../types' {
  export interface GraphQLValues {
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
          await prisma.watchThrough.findFirstOrThrow({
            where: {id: watchThroughId, userId: user.id},
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
  async watchEpisodes(
    _,
    {
      series: seriesInput,
      from,
      to,
      episodes: episodeSelectors,
      ranges: episodeRanges,
      updateWatchLater = true,
    },
    {user, prisma},
  ) {
    const episodes = new EpisodeSelection();

    if (episodeSelectors) {
      episodes.add(...episodeSelectors);
    } else if (episodeRanges) {
      episodes.add(
        ...episodeRanges.map((range) =>
          episodeRangeSelectorObjectFromGraphQLInput(range),
        ),
      );
    } else {
      episodes.add(episodeRangeSelectorObjectFromGraphQLInput({from, to}));
    }

    const ranges = episodes.ranges();

    if (ranges.length === 0) {
      throw new Error(
        'You must provide at least one episode with the `episodes` or `ranges` variable',
      );
    }

    const firstRange = ranges[0]!;
    const lastRange = ranges[ranges.length - 1]!;

    const seriesCondition: Prisma.SeriesWhereInput = {};

    if (seriesInput.id) {
      seriesCondition.id = fromGid(seriesInput.id).id;
    } else if (seriesInput.handle) {
      seriesCondition.handle = seriesInput.handle;
    } else {
      throw new Error(`You must provide either series.id or series.handle`);
    }

    const series = await prisma.series.findFirstOrThrow({
      where: seriesCondition,
      include: {
        seasons: {
          where:
            firstRange.from || lastRange.to
              ? {
                  number: {
                    gte: firstRange.from?.season,
                    lte: lastRange.to?.season,
                  },
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
    });

    await prisma.watch.createMany({
      data: series.seasons.flatMap<Prisma.WatchCreateManyInput>((season) => {
        const matchingEpisodes = season.episodes.filter((episode) =>
          episodes.includes({season: season.number, episode: episode.number}),
        );

        const finishedSeason =
          season.status === 'ENDED' &&
          matchingEpisodes[matchingEpisodes.length - 1]?.id ===
            season.episodes[season.episodes.length - 1]?.id;

        return [
          ...matchingEpisodes.map(
            (episode): Prisma.WatchCreateManyInput => ({
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

    const validatedWatch = await prisma.watch.findFirstOrThrow({
      where: {id, userId: user.id},
      select: {id: true},
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
        ? prisma.season.findFirstOrThrow({
            where: {id: seasonId},
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
      ? prisma.watchThrough.findFirstOrThrow({
          where: {id: watchThroughId, userId: user.id},
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
