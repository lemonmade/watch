import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  InlineGrid as InlineGridElement,
  InlineGridProperties,
} from '@watching/clips/elements';

import type {GridProps} from './Grid.tsx';
import {useCustomElementProperties} from './shared.ts';

export interface InlineGridProps
  extends PropsWithChildren<
      Omit<Partial<InlineGridProperties>, keyof GridProps>
    >,
    Omit<GridProps, 'ref' | 'direction'> {
  ref?: ForwardedRef<InlineGridElement>;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-inline-grid': InlineGridProps;
    }
  }
}

export const InlineGrid = forwardRef<InlineGridElement, InlineGridProps>(
  function InlineGrid(props, ref) {
    useCustomElementProperties(props, ref);
    return <ui-inline-grid {...props} ref={ref} />;
  },
);
