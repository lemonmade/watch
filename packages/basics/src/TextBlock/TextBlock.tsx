import React, {PropsWithChildren} from 'react';
import styles from './TextBlock.css';

export function TextBlock({children}: PropsWithChildren<{}>) {
  return <p className={styles.TextBlock}>{children}</p>;
}
