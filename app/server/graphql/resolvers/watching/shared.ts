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
  const watchThrough = await prisma.watchThrough.findFirstOrThrow({
    where: {id},
  });

  const episodeNumber = episode.number;

  const season = await prisma.season.findFirstOrThrow({
    where: {id: episode.seasonId},
    select: {status: true, number: true, episodeCount: true},
  });

  const selection = EpisodeSelection.from(
    ...(watchThrough.includeEpisodes as any),
  );

  const nextEpisode = selection.nextEpisode(
    episodeNumber === season.episodeCount && season.status === 'ENDED'
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
      nextEpisode: EpisodeSelection.stringify(nextEpisode),
      updatedAt,
    },
  });
}
