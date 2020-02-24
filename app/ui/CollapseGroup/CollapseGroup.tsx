import React from 'react';
import {ReactPropsFromRemoteComponentType} from '@remote-ui/react';
import styles from './CollapseGroup.css';

type Props = ReactPropsFromRemoteComponentType<
  typeof import('components').CollapseGroup
>;

export function CollapseGroup({title, children}: Props) {
  return (
    <div className={styles.CollapseGroup}>
      <div className={styles.Heading}>{title}</div>
      <div className={styles.Content}>{children}</div>
    </div>
  );
}
