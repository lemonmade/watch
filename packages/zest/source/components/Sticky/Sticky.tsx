import type {PropsWithChildren} from 'react';

import styles from './Sticky.module.css';

export interface StickyProps {}

export function Sticky({children}: PropsWithChildren<StickyProps>) {
  return <div className={styles.Sticky}>{children}</div>;
}
