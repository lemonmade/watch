import {createContext, useContext, useMemo} from 'react';
import type {PropsWithChildren} from 'react';

import type {EmphasisValue, ActionRoleKeyword} from '../system';

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
