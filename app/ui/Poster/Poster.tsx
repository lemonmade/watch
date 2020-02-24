import React from 'react';
import {ReactPropsFromRemoteComponentType} from '@remote-ui/react';
import styles from './Poster.css';

type Props = ReactPropsFromRemoteComponentType<
  typeof import('components').Poster
>;

export function Poster({source, accessibilityLabel}: Props) {
  return (
    <span
      aria-label={accessibilityLabel}
      role={accessibilityLabel == null ? 'presentation' : undefined}
      style={{backgroundImage: `url(${source})`}}
      className={styles.Poster}
    />
  );
}
