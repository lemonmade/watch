import {useRef, useEffect, type PropsWithChildren} from 'react';
import {classes} from '@lemon/css';

import {
  useImplicitAction,
  ImplicitActionReset,
  ConnectedAccessoryReset,
} from '../../utilities/actions';
import {useCanvas, type Canvas} from '../../utilities/canvas';

import systemStyles from '../../system.module.css';

import styles from './Modal.module.css';

interface ModalProps {}

export function Modal({children}: PropsWithChildren<ModalProps>) {
  const ref = useRef<HTMLDivElement>(null);
  const implicitAction = useImplicitAction();
  const canvas = useCanvas();

  if (
    implicitAction == null ||
    implicitAction.type !== 'activation' ||
    implicitAction.target == null
  ) {
    return null;
  }

  const {id, active = false} = implicitAction.target;

  return active ? (
    <ConnectedAccessoryReset>
      <ImplicitActionReset>
        <LockCanvas canvas={canvas} />
        <div
          className={classes(
            systemStyles.resetOrientation,
            styles.Modal,
            active && styles.active,
          )}
          id={id}
          ref={ref}
        >
          {children}
        </div>
        <div
          className={styles.Backdrop}
          onPointerDown={() => {
            implicitAction.perform?.();
          }}
        />
      </ImplicitActionReset>
    </ConnectedAccessoryReset>
  ) : null;
}

function LockCanvas({canvas}: {canvas: Canvas}) {
  useEffect(() => {
    canvas.locked.value = true;

    return () => {
      canvas.locked.value = false;
    };
  }, [canvas]);

  return null;
}
