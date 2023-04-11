import {classes} from '@lemon/css';

import {type SpacingKeyword} from '../../system.ts';

import styles from './Spacer.module.css';

export interface SpacerProps {
  stretch?: boolean;
  size?: boolean | SpacingKeyword;
}

const SIZE_CLASS_MAP = new Map<SpacerProps['size'], string | undefined>([
  [false, styles.sizeNone],
  ['none', styles.sizeNone],
  ['small.2', styles.sizeSmall2],
  ['small.1', styles.sizeSmall1],
  ['small', styles.sizeSmall1],
  ['large', styles.sizeLarge1],
  ['large.1', styles.sizeLarge1],
  ['large.2', styles.sizeLarge2],
]);

export function Spacer({stretch, size}: SpacerProps) {
  return (
    <div
      className={classes(
        styles.Spacer,
        stretch && styles.stretch,
        SIZE_CLASS_MAP.get(size),
      )}
    />
  );
}
