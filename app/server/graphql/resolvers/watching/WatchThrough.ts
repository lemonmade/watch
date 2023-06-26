import type {WatchThrough as DatabaseWatchThrough} from '@prisma/client';
import {
  EpisodeSelection,
  type EpisodeSelector,
  type EpisodeEndpointSelectorObject,
} from '@watching/api';

import {bufferFromSlice, sliceFromBuffer} from '~/global/slices.ts';

import {toGid, fromGid} from '../shared/id.ts';
import {
  addResolvedType,
  createResolver,
  createQueryResolver,
  createMutationResolver,
  createResolverWithGid,
} from '../shared/resolvers.ts';

import {WatchThrough as WatchThroughApp} from '../apps.ts';
import {VIRTUAL_WATCH_LATER_LIST, addSeriesToWatchLater} from '../lists.ts';

declare module '../types' {
  export interface ValueMap {
    WatchThrough: DatabaseWatchThrough;
  }
}

export const Query = createQueryResolver({
  watchThrough(_, {id}, {prisma, user}) {
    return prisma.watchThrough.findFirst({
      where: {id: fromGid(id).id, userId: user.id},
    });
  },
  watchThroughs(_, {status = 'ONGOING'}, {prisma, user}) {
    return prisma.watchThrough.findMany({
      where: {status: status ?? undefined, userId: user.id},
      take: 50,
      orderBy: {updatedAt: 'desc'},
    });
  },
  randomWatchThrough(_, __, {prisma, user}) {
    return prisma.watchThrough.findFirst({
      where: {status: 'ONGOING', userId: user.id},
      rejectOnNotFound: false,
    });
  },
});

export const Mutation = createMutationResolver({
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
        seasons: {
          select: {
            id: true,
            number: true,
            episodeCount: true,
            firstAired: true,
          },
        },
      },
      rejectOnNotFound: true,
    });

    const normalizedFrom: EpisodeEndpointSelectorObject = from
      ? {season: from.season, episode: from.episode ?? undefined}
      : includeSpecials && series.seasons.some((season) => season.number === 0)
      ? {season: 0}
      : {season: 1};

    const normalizedTo: EpisodeEndpointSelectorObject = to
      ? {
          season: to.season,
          episode: to.episode ?? undefined,
        }
      : {
          season: Math.max(
            ...series.seasons.map((season) =>
              seasonHasStarted(season) ? season.number : 1,
            ),
          ),
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
        nextEpisode: EpisodeSelection.stringify({
          episode: 1,
          ...normalizedFrom,
        }),
        includeEpisodes: EpisodeSelection.from({
          from: normalizedFrom,
          to: normalizedTo,
        }).selectors(),
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
      errors: [],
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
});

export const WatchThrough = createResolverWithGid('WatchThrough', {
  url: ({id}, _, {request}) => new URL(`/app/watching/${id}`, request.url).href,
  series({seriesId}, _, {prisma}) {
    return prisma.series.findFirst({
      where: {id: seriesId},
      rejectOnNotFound: true,
    });
  },
  from({from}) {
    const slice = sliceFromBuffer(from);
    return {episode: slice.episode ?? null, season: slice.season};
  },
  to({to}) {
    const slice = sliceFromBuffer(to);
    return {episode: slice.episode ?? null, season: slice.season};
  },
  on({nextEpisode}) {
    if (nextEpisode == null) return null;
    return EpisodeSelection.parse(nextEpisode as EpisodeSelector);
  },
  async actions({id}, _, {user, prisma}) {
    const [watches, skips] = await Promise.all([
      prisma.watch.findMany({
        where: {watchThroughId: id, userId: user.id},
        include: {
          episode: {select: {number: true, seasonNumber: true}},
          season: {select: {number: true}},
        },
        take: 50,
      }),
      prisma.skip.findMany({
        where: {watchThroughId: id, userId: user.id},
        include: {
          episode: {select: {number: true, seasonNumber: true}},
          season: {select: {number: true}},
        },
        take: 50,
      }),
    ]);

    return [
      ...watches.map((watch) => addResolvedType('Watch', watch)),
      ...skips.map((skip) => addResolvedType('Skip', skip)),
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
    {seriesId, includeEpisodes, nextEpisode: nextEpisodeSelector},
    _,
    {prisma},
  ) {
    if (nextEpisodeSelector == null) return 0;

    const nextEpisode = EpisodeSelection.parse(
      nextEpisodeSelector as EpisodeSelector,
    );
    const lastRange = EpisodeSelection.from(includeEpisodes as any)
      .ranges()
      .pop()!;

    // This logic is a bit incorrect right now, because there can be
    // episodes that are in the future. For now, the client can query
    // `nextEpisode` to check for that case
    const {seasons} = await prisma.series.findFirst({
      where: {id: seriesId},
      select: {
        seasons: {
          where: {number: {gte: nextEpisode.season, lte: lastRange.to?.season}},
          select: {number: true, episodeCount: true},
        },
      },
      rejectOnNotFound: true,
    });

    return seasons.reduce((count, season) => {
      if (
        nextEpisode.season > season.number ||
        (lastRange.to?.season ?? Infinity) < season.number
      ) {
        return count;
      }

      return (
        count +
        (nextEpisode.season === season.number
          ? season.episodeCount - nextEpisode.episode + 1
          : season.episodeCount)
      );
    }, 0);
  },
  nextEpisode({nextEpisode, seriesId}, _, {prisma}) {
    if (nextEpisode == null) return null;

    const {season, episode} = EpisodeSelection.parse(
      nextEpisode as EpisodeSelector,
    );

    return prisma.episode.findFirst({
      where: {
        number: episode,
        season: {number: season, seriesId},
      },
    });
  },
  settings({spoilerAvoidance}) {
    return {
      spoilerAvoidance,
    };
  },
  ...WatchThroughApp,
});

export const Series = createResolver('Series', {
  watchThroughs({id}, _, {prisma, user}) {
    return prisma.watchThrough.findMany({
      take: 50,
      where: {seriesId: id, userId: user.id},
    });
  },
});

function seasonHasStarted({firstAired}: {firstAired: Date | null}) {
  return firstAired != null && firstAired.getTime() < Date.now();
}

function getSeasonAndEpisode(action: {
  season?: {number: number} | null;
  episode?: {number: number; seasonNumber: number} | null;
}) {
  return action.season
    ? {season: action.season.number}
    : {
        season: action.episode!.seasonNumber,
        episode: action.episode!.number,
      };
}
