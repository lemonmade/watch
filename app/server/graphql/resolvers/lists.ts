import {
  List,
  ListItem,
  Listable,
  Query as ListQuery,
  Mutation as ListMutation,
  Episode as ListEpisode,
  Season as ListSeason,
  Series as ListSeries,
  VIRTUAL_WATCH_LATER_LIST,
} from './lists/List.ts';
import {
  Query as WatchLaterQuery,
  Mutation as WatchLaterMutation,
  Series as WatchLaterSeries,
  addSeriesToWatchLater,
} from './lists/WatchLater.ts';

export {
  List,
  ListItem,
  Listable,
  VIRTUAL_WATCH_LATER_LIST,
  addSeriesToWatchLater,
};

export const Query = {...ListQuery, ...WatchLaterQuery};

export const Mutation = {...ListMutation, ...WatchLaterMutation};

export const Episode = {...ListEpisode};

export const Season = {...ListSeason};

export const Series = {...ListSeries, ...WatchLaterSeries};
