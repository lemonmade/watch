import type {PropsWithChildren} from 'react';

import styles from './Label.module.css';

interface Props {
  target: string;
}

export function Label({target, children}: PropsWithChildren<Props>) {
  return (
    <label htmlFor={target} className={styles.Label}>
      {children}
    </label>
  );
}
