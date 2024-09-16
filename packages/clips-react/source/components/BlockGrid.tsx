import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  BlockGrid as BlockGridElement,
  BlockGridProperties,
} from '@watching/clips/elements';

import type {GridProps} from './Grid.tsx';
import {useCustomElementProperties} from './shared.ts';

export interface BlockGridProps
  extends PropsWithChildren<
      Omit<Partial<BlockGridProperties>, keyof GridProps>
    >,
    Omit<GridProps, 'ref' | 'direction'> {
  ref?: ForwardedRef<BlockGridElement>;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-block-grid': BlockGridProps;
    }
  }
}

export const BlockGrid = forwardRef<BlockGridElement, BlockGridProps>(
  function BlockGrid(props, ref) {
    useCustomElementProperties(props, ref);
    return <ui-block-grid {...props} ref={ref} />;
  },
);
