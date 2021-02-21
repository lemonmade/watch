import type {PropsWithChildren} from 'react';

import {useImplicitAction} from '../ImplicitAction';

import styles from './Pressable.css';

interface Props {
  onPress?(): void;
}

export function Pressable({onPress, children}: PropsWithChildren<Props>) {
  const implicitAction = useImplicitAction();
  const target = implicitAction?.target;

  return (
    <button
      type="button"
      className={styles.Pressable}
      onClick={() => {
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
