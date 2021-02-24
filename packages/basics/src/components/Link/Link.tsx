import type {PropsWithChildren} from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import {Link as RouterLink} from '@quilted/quilt';
import styles from './Link.css';

interface Props {
  to: string;
}

export function Link({to, children}: PropsWithChildren<Props>) {
  return (
    <RouterLink to={to} className={styles.Link}>
      {children}
    </RouterLink>
  );
}
