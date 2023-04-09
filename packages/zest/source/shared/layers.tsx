import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';

import {signal, type Signal} from '@preact/signals-core';

export interface Layer {
  readonly level: number;
  readonly inert: Signal<boolean>;
}

export const LayerContext = createContext<readonly Layer[]>([]);

export function useLayer(options?: {required: true}): Layer;
export function useLayer(options: {required: false}): Layer | undefined;
export function useLayer({required = true}: {required?: boolean} = {}):
  | Layer
  | undefined {
  const layers = useContext(LayerContext);
  const layer = layers[layers.length - 1];

  if (required && layer == null) {
    throw new Error(`No layer found in context`);
  }

  return layer;
}

export function RootLayer({
  layer,
  children,
}: PropsWithChildren<{layer: Layer}>) {
  const layers = useMemo(() => [layer], [layer]);

  return (
    <LayerContext.Provider value={layers}>{children}</LayerContext.Provider>
  );
}

export function StackedLayer({children}: PropsWithChildren<{}>) {
  const ancestors = useContext(LayerContext);

  const layers = useMemo(() => {
    const layer: Layer = {
      level: ancestors.length,
      inert: signal(false),
    };

    return [...ancestors, layer];
  }, [ancestors]);

  return (
    <LayerContext.Provider value={layers}>{children}</LayerContext.Provider>
  );
}
