import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  Heading as HeadingElement,
  HeadingProperties,
} from '@watching/clips/elements';

import {useCustomElementProperties} from './shared.ts';

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
  function Heading(props, ref) {
    const wrapperRef = useCustomElementProperties(props, ref);
    return <ui-heading ref={wrapperRef} />;
  },
);
