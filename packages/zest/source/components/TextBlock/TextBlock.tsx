import type {PropsWithChildren} from 'react';

import styles from './TextBlock.module.css';

interface Props {}

export function TextBlock({children}: PropsWithChildren<Props>) {
  return <p className={styles.TextBlock}>{children}</p>;
}
