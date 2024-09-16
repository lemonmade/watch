import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  Heading as HeadingElement,
  HeadingProperties,
} from '@watching/clips/elements';

export interface HeadingProps
  extends PropsWithChildren<Omit<Partial<HeadingProperties>, 'level'>> {
  ref?: ForwardedRef<HeadingElement>;
  level?:
    | HeadingProperties['level']
    | `${NonNullable<HeadingProperties['level']>}`
    | 'auto';
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-heading': HeadingProps;
    }
  }
}

export const Heading = forwardRef<HeadingElement, HeadingProps>(
  function Heading(props) {
    return <ui-heading {...props} />;
  },
);
