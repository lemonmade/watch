import {ReactNode} from 'react';
import {classes, variation} from '@lemon/css';

import styles from './BlockStack.css';

interface Props {
  children?: ReactNode;
  spacing?: 'none' | 'small' | 'large';
}

export function BlockStack({children, spacing}: Props) {
  return (
    <div
      className={classes(
        styles.BlockStack,
        spacing && styles[variation('spacing', spacing)],
      )}
    >
      {children}
    </div>
  );
}
