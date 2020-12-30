import React, {ReactNode} from 'react';
import {classes, variation} from '@lemon/css';
import styles from './SpacingScale.css';

interface Props {
  children?: ReactNode;
  granularity: 'surfaces' | 'containers' | 'controls' | 'bits';
}

export function SpacingScale({children, granularity}: Props) {
  return (
    <div
      className={classes(
        styles.SpacingScale,
        styles[variation('granularity', granularity)],
      )}
    >
      {children}
    </div>
  );
}
