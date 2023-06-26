import {
  Action,
  Watch,
  Watchable,
  Query as WatchQuery,
  Mutation as WatchMutation,
  Episode as WatchEpisode,
  Season as WatchSeason,
} from './watching/Watch.ts';
import {
  Skip,
  Skippable,
  Mutation as SkipMutation,
  Episode as SkipEpisode,
  Season as SkipSeason,
} from './watching/Skip.ts';
import {
  WatchThrough,
  Query as WatchThroughQuery,
  Mutation as WatchThroughMutation,
  Series as WatchThroughSeries,
} from './watching/WatchThrough.ts';

export {Action, Watch, Watchable, Skip, Skippable, WatchThrough};

export const Query = {...WatchQuery, ...WatchThroughQuery};

export const Mutation = {
  ...WatchMutation,
  ...SkipMutation,
  ...WatchThroughMutation,
};

export const Series = {...WatchThroughSeries};

export const Season = {...WatchSeason, ...SkipSeason};

export const Episode = {...WatchEpisode, ...SkipEpisode};
