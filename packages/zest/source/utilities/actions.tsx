import {createContext, useContext} from 'react';
import type {PropsWithChildren} from 'react';

export interface ImplicitActionTarget {
  readonly id: string;
  readonly type?: 'popover' | 'form';
  readonly active?: boolean;
}

export type ImplicitActionType = 'activation' | 'submit';

export interface ImplicitAction {
  readonly id?: string;
  readonly type: ImplicitActionType;
  readonly target?: ImplicitActionTarget;
  perform?(): void;
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

export function ariaForAction(action?: ImplicitAction) {
  const target = action?.target;

  if (!target) return undefined;

  return {
    'aria-expanded':
      target.type === 'popover' ? target.active ?? false : undefined,
    'aria-controls': target.id,
    'aria-owns': target.id,
  };
}
