import type {PropsWithChildren} from 'react';
import {classes, variation} from '@lemon/css';
import {useImplicitAction, ariaForTarget} from '@lemon/basics';

import styles from './Button.module.css';

interface Props {
  id?: string;
  primary?: boolean;
  blockSize?: 'fill';
  alignContent?: 'start' | 'end' | 'center';
  onPress?(): void;
}

export function Button({
  id,
  children,
  primary,
  blockSize,
  alignContent,
  onPress,
}: PropsWithChildren<Props>) {
  const implicitAction = useImplicitAction(id);

  return (
    <button
      type="button"
      className={classes(
        styles.Button,
        primary && styles.primary,
        alignContent && styles[variation('alignContent', alignContent)],
        blockSize && styles[variation('blockSize', blockSize)],
      )}
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
