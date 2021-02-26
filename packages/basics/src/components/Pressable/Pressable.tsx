import type {PropsWithChildren} from 'react';

import {useImplicitAction} from '../../utilities/actions';
import {useImplicitTarget, ariaForTarget} from '../../utilities/targets';

import styles from './Pressable.css';

interface Props {
  onPress?(): void;
}

export function Pressable({onPress, children}: PropsWithChildren<Props>) {
  const implicitAction = useImplicitAction();
  const implicitTarget = useImplicitTarget();

  return (
    <button
      type="button"
      className={styles.Pressable}
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
