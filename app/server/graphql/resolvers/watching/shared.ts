import type {
  Watch as DatabaseWatch,
  Skip as DatabaseSkip,
  Episode as DatabaseEpisode,
} from '@prisma/client';
import {EpisodeSelection} from '@watching/api';

import {type ResolverContext} from '../shared/resolvers.ts';

export async function updateWatchThrough(
  id: string,
  {
    prisma,
    episode,
    ...action
  }: Pick<ResolverContext, 'prisma'> & {
    episode: DatabaseEpisode;
  } & ({watch: DatabaseWatch} | {skip: DatabaseSkip}),
) {
  const watchThrough = await prisma.watchThrough.findUniqueOrThrow({
    where: {id},
  });

  const episodeNumber = episode.number;

  const season = await prisma.season.findUniqueOrThrow({
    where: {id: episode.seasonId},
    select: {
      status: true,
      number: true,
      episodeCount: true,
      series: {select: {id: true, status: true}},
    },
  });

  const selection = EpisodeSelection.from(
    ...(watchThrough.includeEpisodes as any),
  );

  const finishedLastEpisodeOfSeason =
    episodeNumber === season.episodeCount && season.status === 'ENDED';

  const nextEpisode = selection.nextEpisode(
    finishedLastEpisodeOfSeason
      ? {
          season: season.number + 1,
        }
      : {
          season: season.number,
          episode: episodeNumber,
        },
  );

  const updatedAt =
    'watch' in action
      ? action.watch.finishedAt ??
        action.watch.startedAt ??
        action.watch.createdAt
      : action.skip.at ?? action.skip.createdAt;

  if (nextEpisode == null) {
    const [updatedWatchThrough] = await Promise.all([
      prisma.watchThrough.update({
        where: {id},
        data: {
          status: 'FINISHED',
          nextEpisode: null,
          updatedAt,
          finishedAt: updatedAt,
        },
      }),
      (season.series.status === 'RETURNING' ||
        season.series.status === 'IN_PRODUCTION' ||
        season.series.status === 'PLANNED') &&
        prisma.seriesSubscription.upsert({
          where: {
            seriesId_userId: {
              seriesId: watchThrough.seriesId,
              userId: watchThrough.userId,
            },
          },
          create: {
            seriesId: watchThrough.seriesId,
            userId: watchThrough.userId,
            spoilerAvoidance: watchThrough.spoilerAvoidance,
          },
          update: {},
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

  if (nextEpisode.season !== season.number && finishedLastEpisodeOfSeason) {
    await prisma.watch.create({
      data: {
        userId: watchThrough.userId,
        seasonId: episode.seasonId,
        watchThroughId: watchThrough.id,
        finishedAt:
          'watch' in action ? action.watch.finishedAt : action.skip.at,
      },
    });
  }

  return prisma.watchThrough.update({
    where: {id},
    data: {
      nextEpisode: EpisodeSelection.stringify(nextEpisode),
      updatedAt,
    },
  });
}
