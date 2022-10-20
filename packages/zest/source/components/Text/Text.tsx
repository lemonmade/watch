import type {PropsWithChildren} from 'react';
import {classes, variation} from '@lemon/css';

import styles from './Text.module.css';

export interface TextProps {
  className?: string;
  size?: 'small' | 'base';
  emphasis?: boolean | 'strong' | 'subdued';
  accessibilityRole?: 'code';
}

export function Text({
  size,
  className,
  children,
  emphasis,
  accessibilityRole,
}: PropsWithChildren<TextProps>) {
  return (
    <span
      className={classes(
        styles.Text,
        size && styles[variation('size', size)],
        emphasis &&
          styles[
            variation(
              'emphasis',
              typeof emphasis === 'boolean' ? 'strong' : emphasis,
            )
          ],
        accessibilityRole === 'code' && styles.code,
        className,
      )}
    >
      {children}
    </span>
  );
}
