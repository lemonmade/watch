import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  BlockStack as BlockStackElement,
  BlockStackProperties,
} from '@watching/clips/elements';

import type {StackProps} from './Stack.tsx';

export interface BlockStackProps
  extends PropsWithChildren<
      Omit<Partial<BlockStackProperties>, keyof StackProps>
    >,
    Omit<StackProps, 'ref' | 'direction'> {
  ref?: ForwardedRef<BlockStackElement>;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-block-stack': BlockStackProps;
    }
  }
}

export const BlockStack = forwardRef<BlockStackElement, BlockStackProps>(
  function BlockStack(props, ref) {
    return <ui-block-stack {...props} ref={ref} />;
  },
);
