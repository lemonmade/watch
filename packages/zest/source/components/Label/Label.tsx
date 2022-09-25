import type {PropsWithChildren} from 'react';
import {classes} from '@lemon/css';

import systemStyles from '../../system.module.css';

import styles from './Label.module.css';

interface Props {
  target: string;
  visibility?: 'hidden' | 'visible';
}

export function Label({
  target,
  visibility,
  children,
}: PropsWithChildren<Props>) {
  return (
    <label
      htmlFor={target}
      className={classes(
        styles.Label,
        visibility === 'hidden' && systemStyles.visibilityVisuallyHidden,
      )}
    >
      {children}
    </label>
  );
}
