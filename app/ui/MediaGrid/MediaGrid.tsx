import React from 'react';
import {ReactPropsFromRemoteComponentType} from '@remote-ui/react';
import styles from './MediaGrid.css';

type Props = ReactPropsFromRemoteComponentType<
  typeof import('components').MediaGrid
>;

export function MediaGrid({children}: Props) {
  return <div className={styles.MediaGrid}>{children}</div>;
}
