import {
  EpisodeSelection,
  type EpisodeEndpointSelectorObject,
  type EpisodeRangeSelectorObject,
} from '@watching/api';

import type {EpisodeRangeInput, EpisodeEndpointInput} from '../../schema.ts';

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

function episodeEndpointSelectorObjectFromGraphQLInput(
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
