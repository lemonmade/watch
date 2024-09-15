import type {RenderableProps} from 'preact';

import type {
  BlockStack as BlockStackElement,
  BlockStackProperties,
} from '@watching/clips/elements';

import type {StackProps} from './Stack.tsx';

export interface BlockStackProps
  extends Omit<Partial<BlockStackProperties>, keyof StackProps>,
    Omit<StackProps, 'direction'> {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-block-stack': RenderableProps<BlockStackProps, BlockStackElement>;
    }
  }
}

export function BlockStack(
  props: RenderableProps<BlockStackProps, BlockStackElement>,
) {
  return <ui-block-stack {...props} />;
}
