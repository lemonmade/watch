import type {PropsWithChildren} from 'react';

import styles from './Sticky.css';

interface Props {}

export function Sticky({children}: PropsWithChildren<Props>) {
  return <div className={styles.Sticky}>{children}</div>;
}
