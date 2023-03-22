import {classes} from '@lemon/css';
import {Poster, Pressable, Tag, Text, Spacer, BlockStack} from '@lemon/zest';

import styles from './WatchThroughItem.module.css';

interface Series {
  name: string;
  poster?: string;
}

interface Episode {
  title: string;
  poster?: string;
  number: number;
  seasonNumber: number;
  firstAired?: string;
}

interface Props {
  to: string;
  series: Series;
  nextEpisode?: Episode;
  unfinishedEpisodeCount?: number;
}

export function WatchThroughItem({
  to,
  nextEpisode,
  series,
  unfinishedEpisodeCount = 0,
}: Props) {
  return (
    <Pressable
      to={to}
      inlineAlignment="start"
      className={classes(
        styles.WatchThrough,
        unfinishedEpisodeCount > 1 && styles.hasFootnotes,
      )}
    >
      <Poster
        label={series.name}
        source={nextEpisode?.poster ?? series.poster}
      />
      <BlockStack padding="small" spacing="small.2">
        <Text emphasis>{nextEpisode?.title}</Text>
        {nextEpisode && (
          <p className={styles.WatchThroughNextEpisodeTiming}>
            S{nextEpisode.seasonNumber}E{nextEpisode.number} •{' '}
            {nextEpisode.firstAired &&
              new Date(
                new Date(nextEpisode.firstAired).getTime() +
                  new Date().getTimezoneOffset() * 60_000,
              ).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
          </p>
        )}
      </BlockStack>
      {unfinishedEpisodeCount > 1 && (
        <>
          <Spacer size="small" />
          <div className={styles.WatchThroughFootnote}>
            <Tag>+{unfinishedEpisodeCount - 1} more</Tag>
          </div>
        </>
      )}
    </Pressable>
  );
}
