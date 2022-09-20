import {useMemo, type ReactNode, type PropsWithChildren} from 'react';
import {signal} from '@preact/signals-core';

import styles from '../system.module.css';

import {useUniqueId} from './id';
import {ImplicitActionContext, type ImplicitAction} from './actions';

interface ModalContextProps {
  modal: ReactNode | false;
}

export function ImplicitModalActivation({
  modal,
  children,
}: PropsWithChildren<ModalContextProps>) {
  const id = useUniqueId('Modal');

  const implicitAction = useMemo<ImplicitAction>(() => {
    const active = signal(false);

    return {
      id,
      type: 'activation',
      target: {
        id,
        type: 'modal',
        active,
        async set(newActive) {
          active.value = newActive;
        },
      },
    };
  }, [id]);

  return (
    <ImplicitActionContext action={implicitAction}>
      <ModalTrigger>{children}</ModalTrigger>
      {modal}
    </ImplicitActionContext>
  );
}

interface ModalTriggerProps {}

function ModalTrigger({children}: PropsWithChildren<ModalTriggerProps>) {
  return <div className={styles.displayInlineGrid}>{children}</div>;
}
