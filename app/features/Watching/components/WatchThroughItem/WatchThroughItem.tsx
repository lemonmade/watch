import React from 'react';
import {classes} from '@lemon/css';

import {Link, Poster} from 'components';

import styles from './WatchThroughItem.css';

interface Series {
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
