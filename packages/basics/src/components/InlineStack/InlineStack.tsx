import {ReactNode} from 'react';
import {classes, variation} from '@lemon/css';

import styles from './InlineStack.css';

interface Props {
  children?: ReactNode;
  spacing?: 'none' | 'small' | 'large';
}

export function BlockStack({children, spacing}: Props) {
  return (
    <div
      className={classes(
        styles.Stack,
        styles.block,
        spacing && styles[variation('spacing', spacing)],
      )}
    >
      {children}
    </div>
  );
}

export function InlineStack({children, spacing}: Props) {
  return (
    <div
      className={classes(
        styles.InlineStack,
        spacing && styles[variation('spacing', spacing)],
      )}
    >
      {children}
    </div>
  );
}
