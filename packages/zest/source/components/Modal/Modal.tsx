import {useRef, useEffect, type PropsWithChildren} from 'react';
import {classes} from '@lemon/css';

import {
  useImplicitAction,
  ImplicitActionReset,
  ConnectedAccessoryReset,
} from '../../utilities/actions';
import {useCanvas, type Canvas} from '../../utilities/canvas';
import {StackedLayer} from '../../utilities/layers';

import systemStyles from '../../system.module.css';

import {Portal} from '../Portal';

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

  const {id, active} = implicitAction.target;

  return active.value ? (
    <ConnectedAccessoryReset>
      <ImplicitActionReset>
        <LockCanvas canvas={canvas} />
        <Portal>
          <StackedLayer>
            <div
              className={classes(
                systemStyles.resetOrientation,
                styles.Modal,
                styles.active,
              )}
              id={id}
              ref={ref}
            >
              {children}
            </div>
          </StackedLayer>
          <div
            className={styles.Backdrop}
            onPointerDown={() => {
              implicitAction.target.set(false);
            }}
          />
        </Portal>
      </ImplicitActionReset>
    </ConnectedAccessoryReset>
  ) : null;
}

function LockCanvas({canvas}: {canvas: Canvas}) {
  useEffect(() => {
    canvas.inert.value = true;
    canvas.scroll.value = 'locked';

    return () => {
      canvas.inert.value = false;
      canvas.scroll.value = 'auto';
    };
  }, [canvas]);

  return null;
}
