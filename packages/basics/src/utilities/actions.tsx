import {createContext, useContext} from 'react';
import type {PropsWithChildren} from 'react';

export interface Target {
  readonly id: string;
  readonly type?: 'popover';
  readonly active?: boolean;
}

export interface Action {
  readonly id?: string;
  readonly target?: Target;
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

export function ariaForTarget(target?: Target) {
  if (!target) return undefined;

  return {
    'aria-expanded':
      target.type === 'popover' ? target.active ?? false : undefined,
    'aria-controls': target.id,
    'aria-owns': target.id,
  };
}
