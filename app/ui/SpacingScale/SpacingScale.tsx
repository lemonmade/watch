import React from 'react';
import {classes, variation} from '@lemon/css';

import {ReactPropsFromRemoteComponentType} from '@remote-ui/react';

import styles from './SpacingScale.css';

export function SpacingScale({
  children,
  granularity,
}: ReactPropsFromRemoteComponentType<
  typeof import('components').SpacingScale
>) {
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
