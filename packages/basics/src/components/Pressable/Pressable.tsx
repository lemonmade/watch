import {classes, variation} from '@lemon/css';
import type {PropsWithChildren} from 'react';

import {useImplicitAction} from '../../utilities/actions';
import {useImplicitTarget, ariaForTarget} from '../../utilities/targets';

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
  const implicitTarget = useImplicitTarget();

  return (
    <button
      type="button"
      className={classes(
        styles.Pressable,
        alignContent && styles[variation('alignContent', alignContent)],
        blockSize && styles[variation('blockSize', blockSize)],
      )}
      onClick={() => {
        implicitAction?.perform();
        onPress?.();
      }}
      {...ariaForTarget(implicitTarget)}
    >
      {children}
    </button>
  );
}
