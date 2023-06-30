import type {
  Prisma,
  WatchThrough as DatabaseWatchThrough,
} from '@prisma/client';
import {
  EpisodeSelection,
  EpisodeRange,
  type EpisodeSelector,
} from '@watching/api';

import {toGid, fromGid} from '../shared/id.ts';
import {
  addResolvedType,
  createResolver,
  createQueryResolver,
  createMutationResolver,
  createResolverWithGid,
} from '../shared/resolvers.ts';
import {episodeRangeSelectorObjectFromGraphQLInput} from '../shared/episode-selection.ts';

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
      series: seriesInput,
      from,
      to,
      episodes: episodeSelection,
      episodeRanges,
      includeSpecials = false,
      spoilerAvoidance: explicitSpoilerAvoidance,
      updateWatchLater = true,
    },
    {user, prisma},
  ) {
    const seriesCondition: Prisma.SeriesWhereInput = {};

    if (seriesInput.id) {
      seriesCondition.id = fromGid(seriesInput.id).id;
    } else if (seriesInput.handle) {
      seriesCondition.handle = seriesInput.handle;
    } else {
      throw new Error(`You must provide either series.id or series.handle`);
    }

    const series = await prisma.series.findFirst({
      where: seriesCondition,
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

    const lastStartedSeason = Math.max(
      ...series.seasons.map((season) =>
        seasonHasStarted(season) ? season.number : 1,
      ),
    );

    const selection = new EpisodeSelection();

    if (episodeSelection) {
      selection.add(
        ...episodeSelection.map((selection) => {
          const range = new EpisodeRange(selection);
          range.to ??= {season: lastStartedSeason};
          return range;
        }),
      );
    } else if (episodeRanges) {
      selection.add(
        ...episodeRanges.map((range) =>
          episodeRangeSelectorObjectFromGraphQLInputWithMaxSeason(
            range,
            lastStartedSeason,
          ),
        ),
      );
    } else {
      selection.add(
        episodeRangeSelectorObjectFromGraphQLInputWithMaxSeason(
          {from, to},
          lastStartedSeason,
        ),
      );
    }

    if (selection.from == null) {
      selection.add({from: {season: 1}, to: selection.to});
    }

    if (includeSpecials) {
      selection.add({season: 0});
    }

    const ranges = selection.ranges();

    if (ranges.length === 0) {
      throw new Error(
        `You must provide either 'episodes', 'episodeRanges', or 'from' and 'to'`,
      );
    }

    const firstRange = ranges[0]!;
    const lastRange = ranges[ranges.length - 1]!;

    const toSeason = series.seasons.find(
      (season) => season.number === lastRange.to!.season,
    )!;

    let spoilerAvoidance = explicitSpoilerAvoidance;

    if (spoilerAvoidance == null) {
      const [{spoilerAvoidance: userSpoilerAvoidance}, lastSeasonWatch] =
        await Promise.all([
          prisma.user.findFirstOrThrow({
            where: {id: user.id},
          }),
          prisma.watch.findFirst({
            where: {userId: user.id, seasonId: toSeason.id},
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
        seriesId: series.id,
        userId: user.id,
        nextEpisode: EpisodeSelection.stringify({
          episode: firstRange.from!.episode ?? 1,
          season: firstRange.from!.season,
        }),
        includeEpisodes: selection.selectors(),
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
  from({includeEpisodes}) {
    const ranges = new EpisodeSelection(...(includeEpisodes as any)).ranges();
    return ranges[0]!.from!;
  },
  to({includeEpisodes}) {
    const ranges = new EpisodeSelection(...(includeEpisodes as any)).ranges();
    return ranges[ranges.length - 1]!.to!;
  },
  episodeSelection({includeEpisodes}) {
    return new EpisodeSelection(...(includeEpisodes as any)).selectors();
  },
  episodeRanges({includeEpisodes}) {
    return new EpisodeSelection(...(includeEpisodes as any)).ranges();
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
    const lastRange = EpisodeSelection.from(...(includeEpisodes as any))
      .ranges()
      .pop()!;

    // This logic is a bit incorrect right now, because there can be
    // episodes that are in the future. For now, the client can query
    // `nextEpisode` to check for that case
    const {seasons} = await prisma.series.findFirstOrThrow({
      where: {id: seriesId},
      select: {
        seasons: {
          where: {
            number: {gte: nextEpisode.season, lte: lastRange.to!.season},
          },
          select: {number: true, episodeCount: true},
        },
      },
    });

    let unfinishedEpisodeCount = 0;

    for (const season of seasons) {
      if (
        nextEpisode.season > season.number ||
        !lastRange.includes({season: season.number})
      ) {
        continue;
      }

      unfinishedEpisodeCount +=
        nextEpisode.season === season.number
          ? season.episodeCount - nextEpisode.episode + 1
          : season.episodeCount;
    }

    return unfinishedEpisodeCount;
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

function episodeRangeSelectorObjectFromGraphQLInputWithMaxSeason(
  range: Parameters<typeof episodeRangeSelectorObjectFromGraphQLInput>[0],
  maxSeason: number,
) {
  const {from, to} = episodeRangeSelectorObjectFromGraphQLInput(range);

  return {from, to: to ?? {season: maxSeason}};
}
