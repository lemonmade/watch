import {createContext, useMemo, type PropsWithChildren} from 'react';
import {createUseContextHook} from '@quilted/react-utilities';

import {signal, type Signal} from '@preact/signals-core';

export interface Layer {
  readonly inert: Signal<boolean>;
}

export const LayerContext = createContext<Layer | undefined>(undefined);
export const useLayer = createUseContextHook(LayerContext);

// eslint-disable-next-line @typescript-eslint/ban-types
export function StackedLayer({children}: PropsWithChildren<{}>) {
  const layer = useMemo<Layer>(() => {
    return {
      inert: signal(false),
    };
  }, []);

  return (
    <LayerContext.Provider value={layer}>{children}</LayerContext.Provider>
  );
}
