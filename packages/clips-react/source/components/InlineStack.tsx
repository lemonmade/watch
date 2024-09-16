import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  InlineStack as InlineStackElement,
  InlineStackProperties,
} from '@watching/clips/elements';

import type {StackProps} from './Stack.tsx';
import {useCustomElementProperties} from './shared.ts';

export interface InlineStackProps
  extends PropsWithChildren<
      Omit<Partial<InlineStackProperties>, keyof StackProps>
    >,
    Omit<StackProps, 'ref' | 'direction'> {
  ref?: ForwardedRef<InlineStackElement>;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-inline-stack': InlineStackProps;
    }
  }
}

export const InlineStack = forwardRef<InlineStackElement, InlineStackProps>(
  function InlineStack(props, ref) {
    const wrapperRef = useCustomElementProperties(props, ref);
    return <ui-inline-stack {...props} ref={wrapperRef} />;
  },
);
