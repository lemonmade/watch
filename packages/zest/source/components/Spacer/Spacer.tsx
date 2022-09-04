import {classes, variation} from '@lemon/css';

import {type SpacingKeyword} from '../../system';

import styles from './Spacer.module.css';

export interface Props {
  stretch?: boolean;
  size?: boolean | SpacingKeyword;
}

export function Spacer({stretch, size}: Props) {
  return (
    <span
      className={classes(
        styles.Spacer,
        stretch && styles.stretch,
        size === false && styles.sizeNone,
        typeof size === 'string' && styles[variation('size', size)],
      )}
    />
  );
}
