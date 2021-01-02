import {ReactNode} from 'react';
import {classes} from '@lemon/css';
import styles from './Button.css';

interface Props {
  children?: ReactNode;
  primary?: boolean;
  onPress(): void;
}

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
