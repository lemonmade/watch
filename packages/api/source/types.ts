export type SeasonSelector = `${'s' | 'S'}${number}`;
export type EpisodeSelector = `${SeasonSelector}${'e' | 'E'}${number}`;
export type EpisodeEndpointSelector = SeasonSelector | EpisodeSelector;
export type EpisodeRangeSelector = `${EpisodeEndpointSelector | ''}-${
  | EpisodeEndpointSelector
  | ''}`;
export type EpisodeSelectionSelector =
  | EpisodeEndpointSelector
  | EpisodeRangeSelector;

export interface SeasonSelectorObject {
  season: number;
}

export interface EpisodeSelectorObject {
  season: number;
  episode: number;
}

export interface EpisodeEndpointSelectorObject {
  season: number;
  episode?: number;
}

export interface EpisodeRangeSelectorObject {
  from?: EpisodeEndpointSelectorObject;
  to?: EpisodeEndpointSelectorObject;
}
