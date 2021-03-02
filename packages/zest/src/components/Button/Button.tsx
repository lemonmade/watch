import {ReactNode} from 'react';
import {classes} from '@lemon/css';
import {useImplicitAction, ariaForTarget} from '@lemon/basics';

import styles from './Button.css';

interface Props {
  id?: string;
  children?: ReactNode;
  primary?: boolean;
  onPress?(): void;
}

export function Button({id, children, primary, onPress}: Props) {
  const implicitAction = useImplicitAction(id);

  return (
    <button
      type="button"
      className={classes(styles.Button, primary && styles.primary)}
      onClick={() => {
        if (onPress) {
          onPress();
        } else {
          implicitAction?.perform();
        }
      }}
      {...ariaForTarget(implicitAction?.target)}
    >
      {children}
    </button>
  );
}
