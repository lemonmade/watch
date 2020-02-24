import React from 'react';
import {ReactPropsFromRemoteComponentType} from '@remote-ui/react';
import {classes} from '@lemon/css';

import {Link} from '../Link';
import {Poster} from '../Poster';

import styles from './WatchThroughItem.css';

type Props = ReactPropsFromRemoteComponentType<
  typeof import('components').WatchThroughItem
>;

export function WatchThroughItem({
  to,
  nextEpisode,
  series,
  unfinishedEpisodeCount = 0,
}: Props) {
  return (
    <Link
      to={to}
      className={classes(
        styles.WatchThrough,
        unfinishedEpisodeCount > 1 && styles.hasFootnotes,
      )}
    >
      <div className={styles.WatchThroughPoster}>
        <Poster source={nextEpisode?.poster ?? series.poster!} />
      </div>
      <div className={styles.WatchThroughContent}>
        <header className={styles.WatchThroughNextEpisodeMeta}>
          <div className={styles.WatchThroughIndicator} />
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
        </header>
        <p className={styles.WatchThroughNextEpisodeTitle}>
          {nextEpisode?.title}
        </p>
      </div>
      {unfinishedEpisodeCount > 1 && (
        <div className={styles.WatchThroughFootnote}>
          <span className={styles.WatchThroughBadge}>
            +{unfinishedEpisodeCount - 1} more
          </span>
        </div>
      )}
    </Link>
  );
}
