import {classes, variation} from '@lemon/css';
import type {PropsWithChildren} from 'react';

import {useImplicitAction, ariaForTarget} from '../../utilities/actions';

import styles from './Pressable.css';

interface Props {
  onPress?(): void;
  blockSize?: 'fill';
  alignContent?: 'start' | 'end' | 'center';
}

export function Pressable({
  onPress,
  blockSize,
  alignContent,
  children,
}: PropsWithChildren<Props>) {
  const implicitAction = useImplicitAction();

  return (
    <button
      type="button"
      className={classes(
        styles.Pressable,
        alignContent && styles[variation('alignContent', alignContent)],
        blockSize && styles[variation('blockSize', blockSize)],
      )}
      onClick={
        (implicitAction ?? onPress) &&
        (() => {
          implicitAction?.perform();
          onPress?.();
        })
      }
      {...ariaForTarget(implicitAction?.target)}
    >
      {children}
    </button>
  );
}
