import React from 'react';
import {classes} from '@lemon/css';
import {ReactPropsFromRemoteComponentType} from '@remote-ui/react';
import styles from './Button.css';

type Props = ReactPropsFromRemoteComponentType<
  typeof import('components').Button
>;

export function Button({children, primary, onPress}: Props) {
  return (
    <button
      type="button"
      className={classes(styles.Button, primary && styles.primary)}
      onPointerUp={() => onPress()}
    >
      {children}
    </button>
  );
}
