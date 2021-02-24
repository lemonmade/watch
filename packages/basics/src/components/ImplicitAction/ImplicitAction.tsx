import {createContext, useContext} from 'react';
import type {PropsWithChildren} from 'react';

export interface ImplicitActionTarget {
  id: string;
  type?: 'popover';
  active?: boolean;
}

export interface ImplicitAction {
  id?: string;
  target?: ImplicitActionTarget;
  onAction?(): void;
}

export const ImplicitActionInternalContext = createContext<
  ImplicitAction | undefined
>(undefined);

export function useImplicitAction(id?: string) {
  const implicitAction = useContext(ImplicitActionInternalContext);

  if (implicitAction == null || id == null || implicitAction.id === id) {
    return implicitAction;
  }
}

interface Props {
  action?: ImplicitAction;
}

export function ImplicitActionContext({
  action,
  children,
}: PropsWithChildren<Props>) {
  return (
    <ImplicitActionInternalContext.Provider value={action}>
      {children}
    </ImplicitActionInternalContext.Provider>
  );
}
