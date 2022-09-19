import {createContext, useContext, useMemo} from 'react';
import type {PropsWithChildren} from 'react';

import type {EmphasisValue, ActionRoleKeyword} from '../system';

export interface ImplicitActionTarget {
  readonly id: string;
  readonly type?: 'popover' | 'modal' | 'form';
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

interface ImplicitActionProps {
  action?: ImplicitAction;
}

export function ImplicitActionContext({
  action,
  children,
}: PropsWithChildren<ImplicitActionProps>) {
  return (
    <ImplicitActionInternalContext.Provider value={action}>
      {children}
    </ImplicitActionInternalContext.Provider>
  );
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function ImplicitActionReset({children}: PropsWithChildren<{}>) {
  return (
    <ImplicitActionInternalContext.Provider value={undefined}>
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

export interface ActionConnectedAccessory {
  role?: ActionRoleKeyword;
  emphasis?: EmphasisValue;
}

const ActionConnectedAccessoryContext = createContext<
  ActionConnectedAccessory | false
>(false);

// eslint-disable-next-line @typescript-eslint/ban-types
export function ConnectedAccessoryReset({children}: PropsWithChildren<{}>) {
  return (
    <ActionConnectedAccessoryContext.Provider value={false}>
      {children}
    </ActionConnectedAccessoryContext.Provider>
  );
}

export function ConnectedAccessoryContext({
  children,
  role,
  emphasis,
}: PropsWithChildren<{role?: ActionRoleKeyword; emphasis?: EmphasisValue}>) {
  const accessory = useMemo<ActionConnectedAccessory>(
    () => ({role, emphasis}),
    [role, emphasis],
  );

  return (
    <ActionConnectedAccessoryContext.Provider value={accessory}>
      {children}
    </ActionConnectedAccessoryContext.Provider>
  );
}

export function useConnectedAccessory() {
  return useContext(ActionConnectedAccessoryContext);
}
