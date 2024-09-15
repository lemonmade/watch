import type {RenderableProps} from 'preact';

import type {
  InlineGrid as InlineGridElement,
  InlineGridProperties,
} from '@watching/clips/elements';

import type {GridProps} from './Grid.tsx';

export interface InlineGridProps
  extends Omit<Partial<InlineGridProperties>, keyof GridProps>,
    Omit<GridProps, 'direction'> {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-inline-grid': RenderableProps<InlineGridProps, InlineGridElement>;
    }
  }
}

export function InlineGrid(
  props: RenderableProps<InlineGridProps, InlineGridElement>,
) {
  return <ui-inline-grid {...props} />;
}
