import type {ReactNode} from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import {AutoHeadingGroup} from '@quilted/react-auto-headings';

import styles from './Section.css';

export function Section({children}: {children?: ReactNode}) {
  return (
    <AutoHeadingGroup>
      <section className={styles.Section}>{children}</section>
    </AutoHeadingGroup>
  );
}
