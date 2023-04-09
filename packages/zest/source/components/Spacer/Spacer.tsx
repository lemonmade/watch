import {classes, variation} from '@lemon/css';

import {type SpacingKeyword} from '../../system.ts';

import styles from './Spacer.module.css';

export interface SpacerProps {
  stretch?: boolean;
  size?: boolean | SpacingKeyword;
}

export function Spacer({stretch, size}: SpacerProps) {
  return (
    <div
      className={classes(
        styles.Spacer,
        stretch && styles.stretch,
        size === false && styles.sizeNone,
        typeof size === 'string' && styles[variation('size', size)],
      )}
    />
  );
}
