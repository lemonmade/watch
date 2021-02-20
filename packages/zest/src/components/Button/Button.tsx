import {ReactNode} from 'react';
import {classes} from '@lemon/css';

import {useImplicitAction} from '../../utilities/actions';

import styles from './Button.css';

interface Props {
  id?: string;
  children?: ReactNode;
  primary?: boolean;
  onPress?(): void;
}

export function Button({id, children, primary, onPress}: Props) {
  const implicitAction = useImplicitAction(id);
  const target = implicitAction?.target;

  return (
    <button
      type="button"
      className={classes(styles.Button, primary && styles.primary)}
      onPointerUp={() => {
        if (onPress) {
          onPress();
        } else {
          implicitAction?.onAction?.();
        }
      }}
      aria-expanded={target?.active ?? false}
      aria-controls={target?.id}
      aria-owns={target?.id}
    >
      {children}
    </button>
  );
}
