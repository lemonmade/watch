import type {RenderableProps} from 'preact';

import type {
  BlockStack as BlockStackElement,
  BlockStackProperties,
} from '@watching/clips/elements';

import type {StackProps} from './Stack.tsx';

export interface BlockStackProps
  extends RenderableProps<
      Omit<Partial<BlockStackProperties>, keyof StackProps>,
      BlockStackElement
    >,
    Omit<StackProps, 'ref' | 'direction'> {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-block-stack': BlockStackProps;
    }
  }
}

export function BlockStack(props: BlockStackProps) {
  return <ui-block-stack {...props} />;
}
