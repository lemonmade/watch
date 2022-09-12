import {useMemo, ComponentProps} from 'react';

import {Action, BlockStack, Icon} from '@lemon/zest';

import {Page} from '~/shared/page';
import {parseGid, useQuery} from '~/shared/graphql';
import {MediaGrid} from '~/shared/media';

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
  }, [data?.watchThroughs]);

  return (
    <Page
      heading="Watching"
      menu={
        <>
          <Action icon={<Icon source="arrowEnd" />} to="/app/finished">
            Finished watching...
          </Action>
        </>
      }
    >
      <BlockStack spacing>
        <MediaGrid>
          {availableWatchThroughs.map(({id, ...props}) => (
            <WatchThroughItem key={id} {...props} />
          ))}
        </MediaGrid>
      </BlockStack>
    </Page>
  );
}

function watchThroughToProps({
  id,
  series,
  nextEpisode,
  unfinishedEpisodeCount,
}: WatchThrough): ComponentProps<typeof WatchThroughItem> & {
  id: string;
} {
  return {
    id,
    to: `/app/watchthrough/${parseGid(id).id}`,
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
        nextEpisode?.season.poster?.source!.replace('/original/', '/w342/') ??
        series.poster?.source!.replace('/original/', '/w342/'),
    },
    unfinishedEpisodeCount,
  };
}

function sortWatchThroughs(
  {updatedAt: updatedAtOne}: WatchThrough,
  {updatedAt: updatedAtTwo}: WatchThrough,
) {
  // This sorting is too simplified, we need to also look at when
  // the most recent episode came out
  return new Date(updatedAtOne).getTime() > new Date(updatedAtTwo).getTime()
    ? -1
    : 1;
}
