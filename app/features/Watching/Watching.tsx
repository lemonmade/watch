import {useMemo, type ReactNode} from 'react';

import {useLocalizedFormatting, usePerformanceNavigation} from '@quilted/quilt';
import {Menu, Action, Poster, Spacer, Tag} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {useQuery, type ListItemType} from '~/shared/graphql.ts';
import {MediaGrid, MediaGridItem, MediaSelectorText} from '~/shared/media.ts';

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

  const availableWatchThroughs = useMemo(() => {
    const watchThroughs = data?.watchThroughs;
    if (watchThroughs == null) return [];

    const availableWatchThroughs: WatchThrough[] = [];

    for (const watchThrough of watchThroughs) {
      if (watchThrough.nextEpisode?.hasAired) {
        availableWatchThroughs.push(watchThrough);
      }
    }

    return availableWatchThroughs.sort(sortWatchThroughs);
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
  const {url, series, nextEpisode, unfinishedEpisodeCount} = watchThrough;
  const {formatDate} = useLocalizedFormatting();

  let subtitle: ReactNode = null;

  if (nextEpisode) {
    subtitle = (
      <MediaSelectorText emphasis="subdued">
        {nextEpisode.selector}
      </MediaSelectorText>
    );

    if (nextEpisode.firstAired) {
      subtitle = (
        <>
          {subtitle} •{' '}
          {formatDate(new Date(nextEpisode.firstAired), {
            dateStyle: 'medium',
          })}
        </>
      );
    }
  }

  return (
    <MediaGridItem
      to={url}
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
