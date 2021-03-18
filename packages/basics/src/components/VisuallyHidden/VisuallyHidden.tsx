import type {PropsWithChildren} from 'react';

import styles from './VisuallyHidden.css';

interface Props {}

export function VisuallyHidden({children}: PropsWithChildren<Props>) {
  return <div className={styles.VisuallyHidden}>{children}</div>;
}
