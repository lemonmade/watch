import React from 'react';
import {classes, variation} from '@lemon/css';
import {ReactPropsFromRemoteComponentType} from '@remote-ui/react';

import styles from './Stack.css';

export function Stack({
  children,
  direction,
  spacing,
}: ReactPropsFromRemoteComponentType<typeof import('components').Stack>) {
  return (
    <div
      className={classes(
        styles.Stack,
        direction && styles[variation('direction', direction)],
        spacing && styles[variation('spacing', spacing)],
      )}
    >
      {children}
    </div>
  );
}

export function StackItem({
  children,
}: ReactPropsFromRemoteComponentType<typeof import('components').StackItem>) {
  return <div className={styles.StackItem}>{children}</div>;
}
