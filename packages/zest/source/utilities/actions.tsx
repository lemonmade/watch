import {createContext, useContext, useMemo} from 'react';
import type {PropsWithChildren} from 'react';
import {type Signal} from '@preact/signals-core';

import type {EmphasisValue, ActionRoleKeyword} from '../system';

export interface ImplicitActionTarget {
  readonly id: string;
  readonly type?: 'popover' | 'modal' | 'form';
  readonly active?: boolean;
}

export interface ImplicitActionTargetForm {
  readonly id: string;
  readonly type: 'form';
}

export interface ImplicitActionTargetActivatable {
  readonly id: string;
  readonly type: 'popover' | 'modal';
  readonly active: Signal<boolean>;
  set(active: boolean): Promise<void>;
}

export type ImplicitActionType = 'activation' | 'submit';

export interface ImplicitActionBase {
  readonly id?: string;
}

export interface ImplicitActionSubmit extends ImplicitActionBase {
  type: 'submit';
  target: ImplicitActionTargetForm;
}

export interface ImplicitActionActivation extends ImplicitActionBase {
  type: 'activation';
  target: ImplicitActionTargetActivatable;
}

export type ImplicitAction = ImplicitActionSubmit | ImplicitActionActivation;

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
  if (action?.type !== 'activation') return undefined;

  const {target} = action;

  return {
    'aria-expanded':
      target.type === 'popover' ? target.active.value : undefined,
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
