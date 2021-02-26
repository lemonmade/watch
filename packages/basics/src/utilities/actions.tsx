import {createContext, useContext} from 'react';
import type {PropsWithChildren} from 'react';

export interface Action {
  id?: string;
  perform(): void;
}

export const ImplicitActionInternalContext = createContext<Action | undefined>(
  undefined,
);

export function useImplicitAction(id?: string) {
  const implicitAction = useContext(ImplicitActionInternalContext);

  if (implicitAction == null || id == null || implicitAction.id === id) {
    return implicitAction;
  }
}

interface Props {
  action?: Action;
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
