import {createContext, type RenderableProps} from 'preact';
import {useContext, useMemo} from 'preact/hooks';
import {computed, signal, type Signal} from '@quilted/preact-signals';
import {createOptionalContext} from '@quilted/preact-context';

import type {EmphasisValue, ActionRoleKeyword} from '../system';
import {removeFromSet} from './sets';

export interface ActionScope {
  readonly id: string;
  readonly active: Signal<boolean>;
  readonly inProgress: Signal<Set<{readonly id: string}>>;
  perform<T>(action: () => T, options?: {id?: string; signal?: AbortSignal}): T;
}

const ScopeContext = createOptionalContext<ActionScope>();
export const useActionScope = ScopeContext.use;

export function createActionScope({id}: {id: string}): ActionScope {
  const inProgress: ActionScope['inProgress'] = signal(new Set());
  const active = computed(() => inProgress.value.size > 0);
  let actionCount = 0;

  return {
    id,
    active,
    inProgress,
    perform(
      action,
      {id: actionId = `${id}:Action${actionCount++}`, signal} = {},
    ) {
      const actionResult = action();

      if (typeof (actionResult as any)?.then !== 'function') {
        return actionResult;
      }

      const actionObject = {id: actionId};
      const finish = () => {
        inProgress.value = removeFromSet(inProgress.value, actionObject);
      };

      inProgress.value = new Set([...inProgress.value, actionObject]);
      signal?.addEventListener('abort', finish, {once: true});

      return (async () => {
        try {
          const result = await actionResult;
          return result;
        } finally {
          finish();
        }
      })() as any;
    },
  };
}

export function ActionScopeContext({
  scope,
  children,
}: RenderableProps<{scope: ActionScope}>) {
  return (
    <ScopeContext.Provider value={scope}>{children}</ScopeContext.Provider>
  );
}

export function ActionScopeReset({children}: RenderableProps<{}>) {
  return (
    <ScopeContext.Provider value={undefined}>{children}</ScopeContext.Provider>
  );
}

export interface ActionConnectedAccessory {
  inert?: boolean;
  role?: ActionRoleKeyword;
  emphasis?: EmphasisValue;
}

const ActionConnectedAccessoryContext = createContext<
  ActionConnectedAccessory | false
>(false);

export function ConnectedAccessoryReset({children}: RenderableProps<{}>) {
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
  inert,
}: RenderableProps<{
  inert?: boolean;
  role?: ActionRoleKeyword;
  emphasis?: EmphasisValue;
}>) {
  const accessory = useMemo<ActionConnectedAccessory>(
    () => ({role, emphasis, inert}),
    [role, emphasis, inert],
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
