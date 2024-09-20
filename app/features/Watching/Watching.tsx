import {useMemo} from 'preact/hooks';
import type {ComponentChild} from 'preact';

import {useLocalizedFormatting} from '@quilted/quilt/localize';
import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {Menu, Button, Poster, Spacer, Tag} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {
  useGraphQLQuery,
  useGraphQLQueryData,
  useGraphQLQueryRefetchOnMount,
  type ListItemType,
} from '~/shared/graphql.ts';
import {MediaGrid, MediaGridItem, MediaSelectorText} from '~/shared/media.ts';

import watchingQuery, {
  WatchingQueryData,
} from './graphql/WatchingQuery.graphql';

import styles from './Watching.module.css';

export interface Props {}

type WatchThrough = ListItemType<WatchingQueryData['watchThroughs']>;

export default function Watching(_: Props) {
  const query = useGraphQLQuery(watchingQuery);
  useGraphQLQueryRefetchOnMount(query);

  const {watchThroughs} = useGraphQLQueryData(query);

  usePerformanceNavigation();

  const availableWatchThroughs = useMemo(() => {
    const availableWatchThroughs: WatchThrough[] = [];

    for (const watchThrough of watchThroughs) {
      if (watchThrough.nextEpisode?.hasAired) {
        availableWatchThroughs.push(watchThrough);
      }
    }

    return availableWatchThroughs.sort(sortWatchThroughs);
  }, [watchThroughs]);

  return (
    <Page
      heading="Watching"
      menu={
        <Menu>
          <Button icon="arrow.end" to="/app/finished">
            Finished watching
          </Button>
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

  let subtitle: ComponentChild = null;

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
