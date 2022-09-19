import {useRef, type PropsWithChildren} from 'react';
import {classes} from '@lemon/css';

import {
  useImplicitAction,
  ImplicitActionReset,
  ConnectedAccessoryReset,
} from '../../utilities/actions';

import systemStyles from '../../system.module.css';

import styles from './Modal.module.css';

interface ModalProps {}

export function Modal({children}: PropsWithChildren<ModalProps>) {
  const ref = useRef<HTMLDivElement>(null);
  const implicitAction = useImplicitAction();

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
        <div
          className={classes(
            systemStyles.resetOrientation,
            styles.Modal,
            active && styles.active,
          )}
          id={id}
          ref={ref}
          data-state="inactive"
        >
          {children}
        </div>
        <div className={styles.Backdrop} />
      </ImplicitActionReset>
    </ConnectedAccessoryReset>
  ) : null;
}
