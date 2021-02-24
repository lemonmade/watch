import {PropsWithChildren} from 'react';
import styles from './TextBlock.css';

// eslint-disable-next-line @typescript-eslint/ban-types
export function TextBlock({children}: PropsWithChildren<{}>) {
  return <p className={styles.TextBlock}>{children}</p>;
}
