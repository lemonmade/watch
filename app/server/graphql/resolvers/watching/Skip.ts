import type {Skip as DatabaseSkip} from '@prisma/client';

import {fromGid} from '../shared/id.ts';
import {
  addResolvedType,
  createResolver,
  createMutationResolver,
  createResolverWithGid,
  createInterfaceResolver,
} from '../shared/resolvers.ts';

import {VIRTUAL_WATCH_LATER_LIST} from '../lists.ts';

import {updateWatchThrough} from './shared.ts';

declare module '../types' {
  export interface ValueMap {
    Skip: DatabaseSkip;
  }
}

export const Mutation = createMutationResolver({
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
});

export const Skip = createResolverWithGid('Skip', {
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

export const Skippable = createInterfaceResolver();

export const Season = createResolver('Season', {
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
});

export const Episode = createResolver('Episode', {
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
});
