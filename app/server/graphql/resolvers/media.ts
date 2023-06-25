import {
  Episode,
  Query as EpisodeQuery,
  type EpisodeResolver,
} from './media/episode.ts';
import {
  Season,
  Query as SeasonQuery,
  Mutation as SeasonMutation,
  type SeasonResolver,
} from './media/season.ts';
import {
  Series,
  Query as SeriesQuery,
  Mutation as SeriesMutation,
  type SeriesResolver,
} from './media/series.ts';

export {Episode, Season, Series};
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
