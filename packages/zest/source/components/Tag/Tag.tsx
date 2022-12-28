import {type PropsWithChildren} from 'react';
import {classes, variation} from '@lemon/css';

import styles from './Tag.module.css';

export interface TagProps {
  size?: 'default' | 'large';
}

export function Tag({size, children}: PropsWithChildren<TagProps>) {
  return (
    <span
      className={classes(styles.Tag, size && styles[variation('size', size)])}
    >
      {children}
    </span>
  );
}
