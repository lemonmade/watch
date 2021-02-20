import type {ReactNode} from 'react';

import styles from './Section.css';

export function Section({children}: {children?: ReactNode}) {
  return <section className={styles.Section}>{children}</section>;
}
