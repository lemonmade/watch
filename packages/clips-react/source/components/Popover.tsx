import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  Popover as PopoverElement,
  PopoverProperties,
} from '@watching/clips/elements';

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
    return <ui-popover {...props} ref={ref} />;
  },
);
