import {
  Episode,
  EpisodeEndpoint,
  EpisodeRange,
  Query as EpisodeQuery,
  type EpisodeResolver,
} from './media/Episode.ts';
import {
  Season,
  Query as SeasonQuery,
  Mutation as SeasonMutation,
  type SeasonResolver,
} from './media/Season.ts';
import {
  Series,
  Query as SeriesQuery,
  Mutation as SeriesMutation,
  type SeriesResolver,
} from './media/Series.ts';

export {Episode, EpisodeEndpoint, EpisodeRange, Season, Series};
export type {EpisodeResolver, SeasonResolver, SeriesResolver};

export const Query = {
  ...EpisodeQuery,
  ...SeasonQuery,
  ...SeriesQuery,
};

export const Mutation = {
  ...SeasonMutation,
  ...SeriesMutation,
};
