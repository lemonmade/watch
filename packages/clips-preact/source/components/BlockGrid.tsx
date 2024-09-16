import type {RenderableProps} from 'preact';

import type {
  BlockGrid as BlockGridElement,
  BlockGridProperties,
} from '@watching/clips/elements';

import type {GridProps} from './Grid.tsx';

export interface BlockGridProps
  extends RenderableProps<
      Omit<Partial<BlockGridProperties>, keyof GridProps>,
      BlockGridElement
    >,
    Omit<GridProps, 'ref' | 'direction'> {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-block-grid': RenderableProps<BlockGridProps, BlockGridElement>;
    }
  }
}

export function BlockGrid(
  props: RenderableProps<BlockGridProps, BlockGridElement>,
) {
  return <ui-block-grid {...props} />;
}
