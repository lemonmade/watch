import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  Popover as PopoverElement,
  PopoverProperties,
} from '@watching/clips/elements';

import {useCustomElementProperties} from './shared.ts';

export interface PopoverProps
  extends PropsWithChildren<Omit<Partial<PopoverProperties>, 'padding'>> {
  ref?: ForwardedRef<PopoverElement>;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-popover': PopoverProps;
    }
  }
}

export const Popover = forwardRef<PopoverElement, PopoverProps>(
  function Popover(props, ref) {
    const wrapperRef = useCustomElementProperties(props, ref);
    return <ui-popover ref={wrapperRef} />;
  },
);
