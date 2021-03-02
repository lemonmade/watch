import type {PropsWithChildren} from 'react';
import {createContext, useContext} from 'react';

export type Display = 'block' | 'inline';

const ImplicitDisplayContext = createContext<Display | undefined>(undefined);

export const useImplicitDisplay = () => useContext(ImplicitDisplayContext);

export function ImplicitDisplay({
  display,
  children,
}: PropsWithChildren<{display?: Display}>) {
  return (
    <ImplicitDisplayContext.Provider value={display}>
      {children}
    </ImplicitDisplayContext.Provider>
  );
}
