import {createContext, useContext} from 'react';
import type {PropsWithChildren} from 'react';

export interface Target {
  id: string;
  type?: 'popover';
  active?: boolean;
}

export const ImplicitTargetInternalContext = createContext<Target | undefined>(
  undefined,
);

export function useImplicitTarget(id?: string) {
  const implicitTarget = useContext(ImplicitTargetInternalContext);

  if (implicitTarget == null || id == null || implicitTarget.id === id) {
    return implicitTarget;
  }
}

interface Props {
  target?: Target;
}

export function ImplicitTargetContext({
  target,
  children,
}: PropsWithChildren<Props>) {
  return (
    <ImplicitTargetInternalContext.Provider value={target}>
      {children}
    </ImplicitTargetInternalContext.Provider>
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
