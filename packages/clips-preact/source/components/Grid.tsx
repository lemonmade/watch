import type {RenderableProps} from 'preact';

import type {
  Grid as GridElement,
  GridProperties,
} from '@watching/clips/elements';

import {ViewProps} from './View.tsx';

export interface GridProps
  extends RenderableProps<
      Omit<Partial<GridProperties>, 'spacing' | keyof ViewProps>,
      GridElement
    >,
    Omit<ViewProps, 'ref'> {
  spacing?: GridProperties['spacing'] | boolean;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-grid': GridProps;
    }
  }
}

export function Grid(props: GridProps) {
  return <ui-grid {...props} />;
}
