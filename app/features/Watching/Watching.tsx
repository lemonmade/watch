import {useMemo, ComponentProps} from 'react';
import {useQuery} from '@quilted/quilt';

import {Page, MediaGrid} from '@lemon/zest';

import {parseGid} from 'utilities/graphql';

import watchingQuery, {
  WatchingQueryData,
} from './graphql/WatchingQuery.graphql';
import {WatchThroughItem} from './components';

interface Props {}

type WatchThrough = WatchingQueryData.WatchThroughs;

export function Watching(_: Props) {
  const {data} = useQuery(watchingQuery);

  const [availableWatchThroughs] = useMemo(() => {
    const [available, unavailable] = (data?.watchThroughs ?? []).reduce<
      [WatchThrough[], WatchThrough[]]
    >(
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.watchThroughs]);

  return (
    <Page title="Watching">
      <MediaGrid>
        {availableWatchThroughs.map(({id, ...props}) => (
          <WatchThroughItem key={id} {...props} />
        ))}
      </MediaGrid>
    </Page>
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
          poster: nextEpisode.season.poster?.source!,
        }
      : undefined,
    series: {
      poster:
        lastEpisode?.episode.season.poster?.source!.replace(
          '/original/',
          '/w342/',
        ) ?? series.poster?.source!.replace('/original/', '/w342/'),
    },
    unfinishedEpisodeCount,
  };
}

function sortWatchThroughs(
  {
    lastAction: lastActionOne,
    nextEpisode: nextEpisodeOne,
    series: seriesOne,
  }: WatchThrough,
  {
    lastAction: lastActionTwo,
    nextEpisode: nextEpisodeTwo,
    series: seriesTwo,
  }: WatchThrough,
) {
  const lastActionOneDate = actionToDate(lastActionOne);
  const lastActionTwoDate = actionToDate(lastActionTwo);

  if (lastActionOneDate != null && lastActionTwoDate != null) {
    const lastActionOneTime = lastActionOneDate.getTime();
    const lastActionTwoTime = lastActionTwoDate.getTime();

    if (lastActionOneTime === lastActionTwoTime) {
      return seriesOne.name.localeCompare(seriesTwo.name);
    }

    return lastActionOneDate.getTime() > lastActionTwoDate.getTime() ? -1 : 1;
  }

  if (lastActionOneDate != null && lastActionTwoDate == null) {
    return -1;
  }

  if (lastActionTwoDate != null && lastActionOneDate == null) {
    return 1;
  }

  const nextEpisodeOneDate = getFirstAired(seriesOne, nextEpisodeOne);
  const nextEpisodeTwoDate = getFirstAired(seriesTwo, nextEpisodeTwo);

  if (nextEpisodeOneDate != null && nextEpisodeTwoDate != null) {
    const nextEpisodeOneTime = nextEpisodeOneDate.getTime();
    const nextEpisodeTwoTime = nextEpisodeTwoDate.getTime();

    if (nextEpisodeOneTime === nextEpisodeTwoTime) {
      return seriesOne.name.localeCompare(seriesTwo.name);
    }

    return nextEpisodeOneDate.getTime() > nextEpisodeTwoDate.getTime() ? -1 : 1;
  }

  if (nextEpisodeOneDate != null && nextEpisodeTwoDate == null) {
    return -1;
  }

  if (nextEpisodeTwoDate != null && nextEpisodeOneDate == null) {
    return 1;
  }

  return seriesOne.name.localeCompare(seriesTwo.name);
}

function getFirstAired(
  series: Pick<WatchingQueryData.WatchThroughs.Series, 'firstAired'>,
  episode?: Pick<
    WatchingQueryData.WatchThroughs.NextEpisode,
    'firstAired'
  > | null,
) {
  const firstAired = episode?.firstAired ?? series.firstAired;
  return firstAired ? new Date(firstAired) : undefined;
}

function actionToDate(
  action?: WatchingQueryData.WatchThroughs.LastAction | null,
) {
  if (action == null) return undefined;
  switch (action.__typename) {
    case 'Skip':
      return action.at ? new Date(action.at) : undefined;
    case 'Watch':
      return action.finishedAt ? new Date(action.finishedAt) : undefined;
  }
}
