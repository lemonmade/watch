import type {PropsWithChildren} from 'react';

import styles from './Sticky.module.css';

interface Props {}

export function Sticky({children}: PropsWithChildren<Props>) {
  return <div className={styles.Sticky}>{children}</div>;
}
