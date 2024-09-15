import type {RenderableProps} from 'preact';

import type {
  Grid as GridElement,
  GridProperties,
} from '@watching/clips/elements';
import {ViewProps} from './View';

export interface GridProps
  extends Omit<Partial<GridProperties>, 'spacing' | keyof ViewProps>,
    ViewProps {
  spacing?: GridProperties['spacing'] | boolean;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-grid': RenderableProps<GridProps, GridElement>;
    }
  }
}

export function Grid(props: RenderableProps<GridProps, GridElement>) {
  return <ui-grid {...props} />;
}
