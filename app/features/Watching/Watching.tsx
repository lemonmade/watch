import React, {useMemo, ComponentProps} from 'react';
import {useQuery} from '@apollo/react-hooks';

import {CollapseGroup, MediaGrid} from '../../components';
import {parseGid} from '../../utilities/graphql';

import watchingQuery from './graphql/WatchingQuery.graphql';
import {WatchThroughItem} from './components';

interface Props {}

interface WatchThrough {
  id: string;
  series: any;
  nextEpisode: any;
  lastAction: any;
  lastEpisode: any;
  unfinishedEpisodeCount: number;
}

export function Watching(_: Props) {
  const {data} = useQuery(watchingQuery, {
    fetchPolicy: 'cache-and-network',
  });

  const [availableWatchThroughs, unavailableWatchThroughs] = useMemo(() => {
    const [available, unavailable] = ((data?.watchThroughs ??
      []) as WatchThrough[]).reduce<[WatchThrough[], WatchThrough[]]>(
      ([available, unavailable], watchThrough) => {
        return watchThrough.unfinishedEpisodeCount === 0
          ? [available, [...unavailable, watchThrough]]
          : [[...available, watchThrough], unavailable];
      },
      [[], []],
    );

    return [
      available.sort(sortWatchThroughs).map(watchThroughToProps),
      unavailable.sort(sortWatchThroughs).map(watchThroughToProps),
    ] as const;
  }, [data?.watchThroughs]);

  return (
    <>
      <CollapseGroup title="Ready to watch">
        <MediaGrid>
          {availableWatchThroughs.map(({id, ...props}) => (
            <WatchThroughItem key={id} {...props} />
          ))}
        </MediaGrid>
      </CollapseGroup>
      <CollapseGroup title="Upcoming">
        <MediaGrid>
          {unavailableWatchThroughs.map(({id, ...props}) => (
            <WatchThroughItem key={id} {...props} />
          ))}
        </MediaGrid>
      </CollapseGroup>
    </>
  );
}

function watchThroughToProps({
  id,
  series,
  nextEpisode,
  lastEpisode,
  unfinishedEpisodeCount,
}: WatchThrough): ComponentProps<typeof WatchThroughItem> & {
  id: string;
} {
  return {
    id,
    to: `/watchthrough/${parseGid(id).id}`,
    nextEpisode: nextEpisode
      ? {
          title: nextEpisode.title,
          number: nextEpisode.number,
          seasonNumber: nextEpisode.season.number,
          firstAired: nextEpisode.firstAired
            ? new Date(
                new Date(nextEpisode.firstAired).getTime() +
                  new Date().getTimezoneOffset() * 60_000,
              ).toISOString()
            : undefined,
          poster: nextEpisode.season.poster?.source,
        }
      : undefined,
    series: {
      poster:
        lastEpisode?.episode.season.poster?.source.replace(
          '/original/',
          '/w342/',
        ) ?? series.poster?.source.replace('/original/', '/w342/'),
    },
    unfinishedEpisodeCount,
  };
}

function sortWatchThroughs(
  {
    lastAction: lastActionOneRaw,
    nextEpisode: nextEpisodeOne,
    series: seriesOne,
  }: WatchThrough,
  {
    lastAction: lastActionTwoRaw,
    nextEpisode: nextEpisodeTwo,
    series: seriesTwo,
  }: WatchThrough,
) {
  const lastActionDateOneRaw =
    lastActionOneRaw?.finishedAt ?? lastActionOneRaw?.at;

  const lastActionDateTwoRaw =
    lastActionTwoRaw?.finishedAt ?? lastActionTwoRaw?.at;

  if (lastActionDateOneRaw != null && lastActionDateTwoRaw != null) {
    return new Date(lastActionDateOneRaw).getTime() >
      new Date(lastActionDateTwoRaw).getTime()
      ? -1
      : 1;
  }

  if (lastActionDateOneRaw != null && lastActionDateTwoRaw == null) {
    return -1;
  }

  if (lastActionDateTwoRaw != null && lastActionDateOneRaw == null) {
    return 1;
  }

  const nextEpisodeDateOne =
    nextEpisodeOne?.firstAired ?? seriesOne?.firstAired;
  const nextEpisodeDateTwo =
    nextEpisodeTwo?.firstAired ?? seriesTwo?.firstAired;

  if (nextEpisodeDateOne === nextEpisodeDateTwo) {
    return seriesOne.name.localeCompare(seriesTwo.name);
  }

  return new Date(nextEpisodeDateOne).getTime() >
    new Date(nextEpisodeDateTwo).getTime()
    ? -1
    : 1;
}
