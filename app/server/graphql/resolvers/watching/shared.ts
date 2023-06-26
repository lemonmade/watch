import type {
  Watch as DatabaseWatch,
  Skip as DatabaseSkip,
  Episode as DatabaseEpisode,
} from '@prisma/client';
import {EpisodeSelection} from '@watching/api';

import {sliceFromBuffer} from '~/global/slices.ts';

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
  const watchThrough = await prisma.watchThrough.findFirst({
    where: {id},
    rejectOnNotFound: true,
  });

  const episodeNumber = episode.number;

  const season = await prisma.season.findFirstOrThrow({
    where: {id: episode.seasonId},
    select: {status: true, number: true, episodeCount: true},
  });

  const to = sliceFromBuffer(watchThrough.to);

  const nextEpisodeInSeasonNumber =
    episodeNumber === season.episodeCount && season.status === 'ENDED'
      ? undefined
      : episodeNumber + 1;

  const updatedAt =
    'watch' in action
      ? action.watch.finishedAt ??
        action.watch.startedAt ??
        action.watch.createdAt
      : action.skip.at ?? action.skip.createdAt;

  if (
    to.season === season.number &&
    (to.episode === episodeNumber ||
      (to.episode == null && nextEpisodeInSeasonNumber == null))
  ) {
    const [updatedWatchThrough] = await Promise.all([
      prisma.watchThrough.update({
        where: {id},
        data: {
          status: 'FINISHED',
          current: null,
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
      nextEpisode: EpisodeSelection.stringify({
        season:
          nextEpisodeInSeasonNumber == null ? season.number + 1 : season.number,
        episode: nextEpisodeInSeasonNumber ?? 1,
      }),
      current: Buffer.from([
        nextEpisodeInSeasonNumber == null ? season.number + 1 : season.number,
        nextEpisodeInSeasonNumber ?? 1,
      ]),
      updatedAt,
    },
  });
}
