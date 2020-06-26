import React, {ReactNode} from 'react';
import {classes, variation} from '@lemon/css';

import styles from './Stack.css';

interface Props {
  children?: ReactNode;
  spacing?: 'small' | 'large';
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
        styles.Stack,
        styles.inline,
        spacing && styles[variation('spacing', spacing)],
      )}
    >
      {children}
    </div>
  );
}

export function StackItem({children}: {children?: ReactNode}) {
  return <div className={styles.Item}>{children}</div>;
}
