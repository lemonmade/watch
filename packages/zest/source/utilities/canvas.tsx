import {useEffect, createContext} from 'react';
import {createUseContextHook} from '@quilted/react-utilities';
import {type Signal} from '@preact/signals-core';

import {type Layer} from './layers';

export interface Canvas extends Layer {
  readonly scroll: Signal<'locked' | 'auto'>;
  readonly portal: {
    readonly container: Signal<HTMLElement | null>;
  };
}

export const CanvasContext = createContext<Canvas | null>(null);
export const useCanvas = createUseContextHook(CanvasContext);

export function LockCanvas() {
  const canvas = useCanvas();

  useEffect(() => {
    canvas.inert.value = true;
    canvas.scroll.value = 'locked';

    return () => {
      canvas.inert.value = false;
      canvas.scroll.value = 'auto';
    };
  }, [canvas]);

  return null;
}
