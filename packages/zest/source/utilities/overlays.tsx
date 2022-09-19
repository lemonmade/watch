import {useState, useMemo, type ReactNode, type PropsWithChildren} from 'react';

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
  const [active, setActive] = useState(false);

  const implicitAction = useMemo<ImplicitAction>(() => {
    return {
      id,
      type: 'activation',
      perform: () => setActive((active) => !active),
      target: {
        id,
        type: 'modal',
        active,
      },
    };
  }, [id, active]);

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
