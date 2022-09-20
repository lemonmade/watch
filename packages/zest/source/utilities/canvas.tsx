import {createContext} from 'react';
import {createUseContextHook} from '@quilted/react-utilities';
import {type Signal} from '@preact/signals-core';

export interface Canvas {
  readonly locked: Signal<boolean>;
  readonly portal: {
    readonly container: Signal<HTMLElement | null>;
  };
}

export const CanvasContext = createContext<Canvas | null>(null);
export const useCanvas = createUseContextHook(CanvasContext);
