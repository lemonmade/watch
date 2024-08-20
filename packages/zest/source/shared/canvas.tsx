import {useEffect} from 'preact/hooks';
import {createOptionalContext} from '@quilted/quilt/context';
import type {Signal} from '@preact/signals-core';

import type {Layer} from './layers.tsx';

export interface Canvas extends Layer {
  readonly scroll: Signal<'locked' | 'auto'>;
  readonly portal: {
    readonly container: Signal<HTMLElement | null>;
  };
}

export const CanvasContext = createOptionalContext<Canvas>();
export const useCanvas = CanvasContext.use;

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
