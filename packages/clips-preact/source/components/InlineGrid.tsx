import type {RenderableProps} from 'preact';

import type {
  InlineGrid as InlineGridElement,
  InlineGridProperties,
} from '@watching/clips/elements';

import type {GridProps} from './Grid.tsx';

export interface InlineGridProps
  extends RenderableProps<
      Omit<Partial<InlineGridProperties>, keyof GridProps>,
      InlineGridElement
    >,
    Omit<GridProps, 'ref' | 'direction'> {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-inline-grid': InlineGridProps;
    }
  }
}

export function InlineGrid(props: InlineGridProps) {
  return <ui-inline-grid {...props} />;
}
