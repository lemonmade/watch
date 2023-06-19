import {useMemo} from 'react';

import {useLocalizedFormatting, usePerformanceNavigation} from '@quilted/quilt';
import {Menu, Action, Poster, Spacer, Tag} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {parseGid, useQuery, type ListItemType} from '~/shared/graphql.ts';
import {MediaGrid, MediaGridItem} from '~/shared/media.ts';

import watchingQuery, {
  WatchingQueryData,
} from './graphql/WatchingQuery.graphql';

import styles from './Watching.module.css';

export interface Props {}

type WatchThrough = ListItemType<WatchingQueryData['watchThroughs']>;

export default function Watching(_: Props) {
  const {data, isLoading} = useQuery(watchingQuery, {
    refetchOnMount: 'always',
  });

  usePerformanceNavigation({state: isLoading ? 'loading' : 'complete'});

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
      available.sort(sortWatchThroughs),
      unavailable.sort(sortWatchThroughs),
    ] as const;
  }, [data?.watchThroughs]);

  return (
    <Page
      heading="Watching"
      menu={
        <Menu>
          <Action icon="arrow.end" to="/app/finished">
            Finished watching
          </Action>
        </Menu>
      }
    >
      <MediaGrid blockSpacing="large">
        {availableWatchThroughs.map((watchThrough) => (
          <WatchThroughItem key={watchThrough.id} watchThrough={watchThrough} />
        ))}
      </MediaGrid>
    </Page>
  );
}

function WatchThroughItem({watchThrough}: {watchThrough: WatchThrough}) {
  const {id, series, nextEpisode, unfinishedEpisodeCount} = watchThrough;
  const {formatDate} = useLocalizedFormatting();

  let subtitle: string | undefined;

  if (nextEpisode) {
    subtitle = `S${nextEpisode.season.number}E${nextEpisode.number}`;

    if (nextEpisode.firstAired) {
      subtitle += ` • ${formatDate(new Date(nextEpisode.firstAired), {
        dateStyle: 'medium',
      })}`;
    }
  }

  return (
    <MediaGridItem
      to={`/app/watchthrough/${parseGid(id).id}`}
      image={
        <Poster
          label={series.name}
          source={nextEpisode?.season.poster?.source ?? series.poster?.source}
        />
      }
      title={nextEpisode?.title}
      subtitle={subtitle}
    >
      {unfinishedEpisodeCount > 1 && (
        <>
          <Spacer size="small" />
          <div className={styles.WatchThroughFootnote}>
            <Tag>+{unfinishedEpisodeCount - 1} more</Tag>
          </div>
        </>
      )}
    </MediaGridItem>
  );
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
