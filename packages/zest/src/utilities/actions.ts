import {createContext, useContext} from 'react';

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

export const ImplicitActionContext = createContext<ImplicitAction | undefined>(
  undefined,
);

export function useImplicitAction(id?: string) {
  const implicitAction = useContext(ImplicitActionContext);

  if (implicitAction == null || id == null || implicitAction.id === id) {
    return implicitAction;
  }
}
