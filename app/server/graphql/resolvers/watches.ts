import type {
  Watch as DatabaseWatch,
  Skip as DatabaseSkip,
  WatchThrough as DatabaseWatchThrough,
  Episode as DatabaseEpisode,
} from '@prisma/client';

import type {QueryResolver, MutationResolver, Resolver, Context} from './types';
import {toGid, fromGid} from './utilities/id';
import {
  addResolvedType,
  createUnionResolver,
  createInterfaceResolver,
} from './utilities/interfaces';
import {bufferFromSlice, sliceFromBuffer} from './utilities/slices';
import type {Slice} from './utilities/slices';

import type {SeriesResolver, SeasonResolver, EpisodeResolver} from './media';
import {VIRTUAL_WATCH_LATER_LIST} from './lists';
import {addSeriesToWatchLater} from './watch-later';

declare module './types' {
  export interface ValueMap {
    Watch: DatabaseWatch;
    Skip: DatabaseSkip;
    WatchThrough: DatabaseWatchThrough;
  }
}

export const Query: Pick<
  QueryResolver,
  'watch' | 'watchThrough' | 'watchThroughs' | 'randomWatchThrough'
> = {
  watch(_, {id}, {prisma, user}) {
    return prisma.watch.findFirst({
      where: {id: fromGid(id).id, userId: user.id},
    });
  },
  watchThrough(_, {id}, {prisma, user}) {
    return prisma.watchThrough.findFirst({
      where: {id: fromGid(id).id, userId: user.id},
    });
  },
  watchThroughs(_, {status = 'ONGOING'}, {prisma, user}) {
    return prisma.watchThrough.findMany({
      where: {status: status ?? undefined, userId: user.id},
      take: 50,
    });
  },
  randomWatchThrough(_, __, {prisma, user}) {
    return prisma.watchThrough.findFirst({
      where: {status: 'ONGOING', userId: user.id},
      rejectOnNotFound: false,
    });
  },
};

export const WatchThrough: Resolver<'WatchThrough'> = {
  id: ({id}) => toGid(id, 'WatchThrough'),
  series({seriesId}, _, {prisma}) {
    return prisma.series.findFirst({
      where: {id: seriesId},
      rejectOnNotFound: true,
    });
  },
  from({from}) {
    return sliceFromBuffer(from);
  },
  to({to}) {
    return sliceFromBuffer(to);
  },
  on({current}) {
    if (current == null) return null;

    const slice = sliceFromBuffer(current);

    if (slice.episode == null) {
      throw new Error('Invalid current episode');
    }

    return slice;
  },
  async actions({id}, _, {user, prisma}) {
    const [watches, skips] = await Promise.all([
      prisma.watch.findMany({
        where: {watchThroughId: id, userId: user.id},
        include: {
          episode: {select: {number: true, season: {select: {number: true}}}},
          season: {select: {number: true}},
        },
        take: 50,
      }),
      prisma.skip.findMany({
        where: {watchThroughId: id, userId: user.id},
        include: {
          episode: {select: {number: true, season: {select: {number: true}}}},
          season: {select: {number: true}},
        },
        take: 50,
      }),
    ]);

    return [
      ...watches.map(addResolvedType('Watch')),
      ...skips.map(addResolvedType('Skip')),
    ].sort((actionOne, actionTwo) => {
      const {season: seasonOne, episode: episodeOne = 0} =
        getSeasonAndEpisode(actionOne);
      const {season: seasonTwo, episode: episodeTwo = 0} =
        getSeasonAndEpisode(actionTwo);

      return seasonOne !== seasonTwo
        ? seasonTwo - seasonOne
        : episodeTwo - episodeOne;
    });
  },
  watches({id}, _, {user, prisma}) {
    return prisma.watch.findMany({
      where: {watchThroughId: id, userId: user.id},
      take: 50,
    });
  },
  async unfinishedEpisodeCount(
    {seriesId, current: currentBuffer, to: toBuffer},
    _,
    {prisma},
  ) {
    if (currentBuffer == null) return 0;

    const to = sliceFromBuffer(toBuffer);
    const current = sliceFromBuffer(currentBuffer);

    // This logic is a bit incorrect right now, because there can be
    // episodes that are in the future. For now, the client can query
    // `nextEpisode` to check for that case
    const {seasons} = await prisma.series.findFirst({
      where: {id: seriesId},
      select: {
        seasons: {
          where: {number: {gte: current.season, lte: to.season}},
          select: {number: true, episodeCount: true},
        },
      },
      rejectOnNotFound: true,
    });

    return seasons.reduce((count, season) => {
      if (current.season > season.number || to.season < season.number) {
        return count;
      }

      return (
        count +
        (current.season === season.number
          ? season.episodeCount - current.episode! + 1
          : season.episodeCount)
      );
    }, 0);
  },
  nextEpisode({current, seriesId}, _, {prisma}) {
    if (current == null) return null;

    const slice = sliceFromBuffer(current);

    return prisma.episode.findFirst({
      where: {
        number: slice.episode ?? undefined,
        season: {number: slice.season, seriesId},
      },
    });
  },
  settings({spoilerAvoidance}) {
    return {
      spoilerAvoidance,
    };
  },
};

export const Watch: Resolver<'Watch'> = {
  id: ({id}) => toGid(id, 'Watch'),
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
      return addResolvedType('Episode')(episode);
    } else if (season) {
      return addResolvedType('Season')(season);
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
};

export const Skip: Resolver<'Skip'> = {
  id: ({id}) => toGid(id, 'Skip'),
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
      return addResolvedType('Episode')(episode);
    } else if (season) {
      return addResolvedType('Season')(season);
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
};

function getSeasonAndEpisode(action: {
  season?: {number: number} | null;
  episode?: {number: number; season: {number: number}} | null;
}) {
  return action.season
    ? {season: action.season.number}
    : {
        season: action.episode!.season.number,
        episode: action.episode!.number,
      };
}

export const Action = createUnionResolver();

export const Watchable = createInterfaceResolver();

export const Skippable = createInterfaceResolver();

export const Series: Pick<SeriesResolver, 'watchThroughs'> = {
  watchThroughs({id}, _, {prisma, user}) {
    return prisma.watchThrough.findMany({
      take: 50,
      where: {seriesId: id, userId: user.id},
    });
  },
};

export const Season: Pick<
  SeasonResolver,
  'watches' | 'latestWatch' | 'skips' | 'latestSkip'
> = {
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
  skips({id}, _, {prisma, user}) {
    return prisma.skip.findMany({
      where: {seasonId: id, userId: user.id},
      take: 50,
    });
  },
  latestSkip({id}, __, {prisma, user}) {
    return prisma.skip.findFirst({
      where: {seasonId: id, userId: user.id},
      orderBy: {at: 'desc', createdAt: 'desc'},
    });
  },
};

export const Episode: Pick<
  EpisodeResolver,
  'watches' | 'latestWatch' | 'skips' | 'latestSkip'
> = {
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
  skips({id}, _, {prisma, user}) {
    return prisma.skip.findMany({
      where: {episodeId: id, userId: user.id},
      take: 50,
    });
  },
  latestSkip({id}, _, {prisma, user}) {
    return prisma.skip.findFirst({
      where: {episodeId: id, userId: user.id},
      orderBy: {at: 'desc', createdAt: 'desc'},
    });
  },
};

export const Mutation: Pick<
  MutationResolver,
  | 'skipEpisode'
  | 'watchEpisode'
  | 'deleteWatch'
  | 'watchEpisodesFromSeries'
  | 'startWatchThrough'
  | 'stopWatchThrough'
  | 'deleteWatchThrough'
  | 'updateWatchThroughSettings'
> = {
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

    // We should be making sure we don’t need to reset the `current`
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
  async skipEpisode(
    _,
    {
      episode: episodeGid,
      watchThrough: watchThroughGid,
      notes,
      at,
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

    const {episode, ...skip} = await prisma.skip.create({
      data: {
        episodeId,
        watchThroughId: validatedWatchThroughId,
        notes: notes?.content,
        containsSpoilers: notes?.containsSpoilers,
        at,
        userId: user.id,
      },
      include: {
        episode: {
          include: {
            season: {select: {seriesId: true}},
          },
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
        skip,
        episode: episode!,
      });
    }

    return {
      skip,
      episode,
      watchThrough: watchThrough ?? null,
      watchLater: watchLater ?? VIRTUAL_WATCH_LATER_LIST,
    };
  },
  async stopWatchThrough(_, {id: gid, watchLater = false}, {prisma, user}) {
    const {id} = fromGid(gid);

    const validatedWatchThrough = await prisma.watchThrough.findFirst({
      where: {id, userId: user.id},
      select: {id: true, series: {select: {id: true}}},
      rejectOnNotFound: true,
    });

    const watchThrough = await prisma.watchThrough.update({
      data: {status: 'STOPPED', updatedAt: new Date()},
      where: {id: validatedWatchThrough.id},
    });

    if (watchLater) {
      await addSeriesToWatchLater(validatedWatchThrough.series.id, {
        user,
        prisma,
      });
    }

    return {
      watchThrough,
      watchLater:
        (await prisma.list.findFirst({
          where: {watchLaterUser: {id: user.id}},
        })) ?? VIRTUAL_WATCH_LATER_LIST,
    };
  },
  async startWatchThrough(
    _,
    {
      series: seriesGid,
      from,
      to,
      includeSpecials = false,
      spoilerAvoidance: explicitSpoilerAvoidance,
      updateWatchLater = true,
    },
    {user, prisma},
  ) {
    const {id: seriesId} = fromGid(seriesGid);

    const series = await prisma.series.findFirst({
      where: {id: seriesId},
      include: {
        seasons: {select: {id: true, number: true, episodeCount: true}},
      },
      rejectOnNotFound: true,
    });

    const normalizedFrom: Slice =
      from ??
      (includeSpecials && series.seasons.some((season) => season.number === 0)
        ? {season: 0, episode: 1}
        : {season: 1, episode: 1});

    const normalizedTo: Slice = to ?? {
      season: Math.max(...series.seasons.map((season) => season.number)),
    };

    const toSeason = series.seasons.find(
      (season) => season.number === normalizedTo.season,
    )!;

    let spoilerAvoidance = explicitSpoilerAvoidance;

    if (spoilerAvoidance == null) {
      const [{spoilerAvoidance: userSpoilerAvoidance}, lastSeasonWatch] =
        await Promise.all([
          prisma.user.findFirst({
            where: {id: user.id},
            rejectOnNotFound: true,
          }),
          prisma.watch.findFirst({
            where: {userId: user.id, seasonId: toSeason.id},
            rejectOnNotFound: false,
          }),
        ]);

      // If we have watched this season in the past, we won’t worry about showing
      // spoilers
      if (lastSeasonWatch) {
        spoilerAvoidance = 'NONE';
      } else {
        spoilerAvoidance = userSpoilerAvoidance;
      }
    }

    const watchThrough = await prisma.watchThrough.create({
      data: {
        seriesId,
        userId: user.id,
        from: bufferFromSlice(normalizedFrom),
        to: bufferFromSlice(normalizedTo),
        current: bufferFromSlice({episode: 1, ...normalizedFrom}),
        spoilerAvoidance,
      },
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
      watchThrough,
      watchLater: watchLater ?? VIRTUAL_WATCH_LATER_LIST,
    };
  },
  async deleteWatchThrough(_, {id: gid, watchLater = false}, {prisma, user}) {
    const {id} = fromGid(gid);

    const validatedWatchThrough = await prisma.watchThrough.findFirst({
      where: {id, userId: user.id},
      select: {id: true, series: {select: {id: true}}},
      rejectOnNotFound: true,
    });

    await prisma.watchThrough.delete({
      where: {id: validatedWatchThrough.id},
    });

    if (watchLater) {
      await addSeriesToWatchLater(validatedWatchThrough.series.id, {
        user,
        prisma,
      });
    }

    return {
      deletedWatchThroughId: toGid(validatedWatchThrough.id, 'WatchThrough'),
      watchLater:
        (await prisma.list.findFirst({
          where: {watchLaterUser: {id: user.id}},
        })) ?? VIRTUAL_WATCH_LATER_LIST,
    };
  },
  async updateWatchThroughSettings(
    _,
    {id: gid, spoilerAvoidance},
    {user, prisma},
  ) {
    const {id} = fromGid(gid);

    const watchThroughForUser = await prisma.watchThrough.findFirst({
      select: {id: true},
      where: {
        id,
        userId: user.id,
      },
    });

    if (watchThroughForUser == null) {
      return {watchThrough: null};
    }

    const data: Parameters<typeof prisma['watchThrough']['update']>[0]['data'] =
      {};

    if (spoilerAvoidance != null) {
      data.spoilerAvoidance = spoilerAvoidance;
    }

    const watchThrough = await prisma.watchThrough.update({
      data,
      where: {
        id,
      },
    });

    return {watchThrough};
  },
};

// Assumes you already validated ownership of the watchthrough!
async function updateWatchThrough(
  id: string,
  {
    prisma,
    episode,
    ...action
  }: Pick<Context, 'prisma'> & {
    episode: DatabaseEpisode;
  } & ({watch: DatabaseWatch} | {skip: DatabaseSkip}),
) {
  const watchThrough = await prisma.watchThrough.findFirst({
    where: {id},
    rejectOnNotFound: true,
  });

  const episodeNumber = episode.number;

  const season = await prisma.season.findFirst({
    where: {id: episode.seasonId},
    select: {status: true, number: true, episodeCount: true},
    rejectOnNotFound: true,
  });

  const to = sliceFromBuffer(watchThrough.to);

  const nextEpisodeInSeasonNumber =
    episodeNumber === season.episodeCount ? undefined : episodeNumber + 1;

  const updatedAt =
    'watch' in action
      ? action.watch.finishedAt ??
        action.watch.startedAt ??
        action.watch.createdAt
      : action.skip.at ?? action.skip.createdAt;

  if (
    to.season === season.number &&
    (to.episode === episodeNumber ||
      (to.episode == null &&
        nextEpisodeInSeasonNumber == null &&
        season.status === 'ENDED'))
  ) {
    const [updatedWatchThrough] = await Promise.all([
      prisma.watchThrough.update({
        where: {id},
        data: {
          status: 'FINISHED',
          current: null,
          updatedAt,
          finishedAt: updatedAt,
        },
      }),
      prisma.watch.create({
        data: {
          userId: watchThrough.userId,
          seasonId: episode.seasonId,
          watchThroughId: watchThrough.id,
          finishedAt:
            'watch' in action ? action.watch.finishedAt : action.skip.at,
        },
      }),
    ]);

    return updatedWatchThrough;
  }

  return prisma.watchThrough.update({
    where: {id},
    data: {
      current: Buffer.from([
        nextEpisodeInSeasonNumber == null ? season.number + 1 : season.number,
        nextEpisodeInSeasonNumber ?? 1,
      ]),
      updatedAt,
    },
  });
}
