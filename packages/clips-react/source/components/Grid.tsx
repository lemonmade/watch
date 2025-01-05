import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  Grid as GridElement,
  GridProperties,
} from '@watching/clips/elements';

import {ViewProps} from './View.tsx';
import {useCustomElementProperties} from './shared.ts';

export interface GridProps
  extends PropsWithChildren<
      Omit<Partial<GridProperties>, 'spacing' | keyof ViewProps>
    >,
    Omit<ViewProps, 'ref'> {
  ref?: ForwardedRef<GridElement>;
  spacing?: GridProperties['spacing'] | boolean;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-grid': GridProps;
    }
  }
}

export const Grid = forwardRef<GridElement, GridProps>(
  function Grid(props, ref) {
    const wrapperRef = useCustomElementProperties(props, ref);
    return <ui-grid ref={wrapperRef} />;
  },
);
