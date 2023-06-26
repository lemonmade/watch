import type {EpisodeRangeInput, EpisodeEndpointInput} from '../../schema.ts';

import type {Episode as DatabaseEpisode} from '@prisma/client';

import {fromGid} from '../shared/id.ts';
import {imageUrl} from '../shared/images.ts';
import {
  createResolver,
  createResolverWithGid,
  createQueryResolver,
  type Resolver,
} from '../shared/resolvers.ts';

import {Episode as EpisodeLists} from '../lists.ts';
import {Episode as EpisodeWatching} from '../watching.ts';
import {
  EpisodeSelection,
  type EpisodeEndpointSelectorObject,
  type EpisodeRangeSelectorObject,
} from '@watching/api';

declare module '../types.ts' {
  export interface ValueMap {
    Episode: DatabaseEpisode;
    EpisodeRange: EpisodeRangeSelectorObject;
    EpisodeEndpoint: EpisodeEndpointSelectorObject;
  }
}

export type EpisodeResolver = Resolver<'Episode'>;

export const Query = createQueryResolver({
  episode(_, {id, series, season, number, selector}, {prisma}) {
    if (id) {
      return prisma.episode.findFirst({
        where: {id: fromGid(id).id},
      });
    } else if (series) {
      const {handle, id: seriesId} = series;
      const seriesOption = handle
        ? {series: {handle}}
        : seriesId
        ? {seriesId: fromGid(seriesId).id}
        : {};

      if (season != null && number != null) {
        return prisma.episode.findFirst({
          where: {number, seasonNumber: season, ...seriesOption},
        });
      } else if (selector != null) {
        const {episode, season} = EpisodeSelection.parse(selector);

        if (episode == null || season == null) {
          throw new Error(
            `Invalid episode selector: ${JSON.stringify(selector)}}`,
          );
        }

        return prisma.episode.findFirst({
          where: {number: episode, seasonNumber: season, ...seriesOption},
        });
      }
    }

    throw new Error(
      `You must provide either an 'id' or 'series' and 'number' variables`,
    );
  },
});

export const Episode = createResolverWithGid('Episode', {
  selector({number, seasonNumber}) {
    return EpisodeSelection.stringify({episode: number, season: seasonNumber});
  },
  series({seriesId}, _, {prisma}) {
    return prisma.series.findFirstOrThrow({
      where: {id: seriesId},
    });
  },
  season({seasonId}, _, {prisma}) {
    return prisma.season.findFirstOrThrow({
      where: {id: seasonId},
    });
  },
  still({stillUrl}) {
    return stillUrl ? {source: imageUrl(stillUrl, {width: 1_000})} : null;
  },
  async hasAired({firstAired, seasonId}, _, {prisma}) {
    if (firstAired != null) {
      return firstAired.getTime() < Date.now();
    }

    const season = await prisma.season.findFirstOrThrow({
      where: {id: seasonId},
    });

    return season.status !== 'CONTINUING';
  },
  ...EpisodeWatching,
  ...EpisodeLists,
});

export const EpisodeRange = createResolver('EpisodeRange', {
  selector({from, to}) {
    return EpisodeSelection.stringify({from, to});
  },
});

export const EpisodeEndpoint = createResolver('EpisodeEndpoint', {
  selector({season, episode}) {
    return EpisodeSelection.stringify({season, episode});
  },
});

export function episodeRangeSelectorObjectFromGraphQLInput({
  selector,
  from,
  to,
}: EpisodeRangeInput): EpisodeRangeSelectorObject {
  if (selector) return EpisodeSelection.parse(selector);

  return {
    from: episodeEndpointSelectorObjectFromGraphQLInput(from),
    to: episodeEndpointSelectorObjectFromGraphQLInput(to),
  };
}

export function episodeEndpointSelectorObjectFromGraphQLInput(
  endpoint: EpisodeEndpointInput | undefined | null,
): EpisodeEndpointSelectorObject | undefined {
  if (endpoint == null) return undefined;
  if (endpoint.selector) return EpisodeSelection.parse(endpoint.selector);

  const {season, episode} = endpoint;

  if (season == null) {
    throw new Error(
      'You must provide a `season` or `selector` field for range endpoint',
    );
  }

  return {season, episode: episode ?? undefined};
}
