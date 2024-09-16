import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  Stack as StackElement,
  StackProperties,
} from '@watching/clips/elements';

import {ViewProps} from './View.tsx';
import {useCustomElementProperties} from './shared.ts';

export interface StackProps
  extends PropsWithChildren<
      Omit<Partial<StackProperties>, 'spacing' | keyof ViewProps>
    >,
    Omit<ViewProps, 'ref'> {
  ref?: ForwardedRef<StackElement>;
  spacing?: StackProperties['spacing'] | boolean;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-stack': StackProps;
    }
  }
}

export const Stack = forwardRef<StackElement, StackProps>(
  function Stack(props, ref) {
    const wrapperRef = useCustomElementProperties(props, ref);
    return <ui-stack {...props} ref={wrapperRef} />;
  },
);
