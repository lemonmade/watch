import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  Footer as FooterElement,
  FooterProperties,
} from '@watching/clips/elements';

import {ViewProps} from './View.tsx';
import {useCustomElementProperties} from './shared.ts';

export interface FooterProps
  extends PropsWithChildren<Omit<Partial<FooterProperties>, keyof ViewProps>>,
    Omit<ViewProps, 'ref'> {
  ref?: ForwardedRef<FooterElement>;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-footer': FooterProps;
    }
  }
}

export const Footer = forwardRef<FooterElement, FooterProps>(
  function Footer(props, ref) {
    const wrapperRef = useCustomElementProperties(props, ref);
    return <ui-footer ref={wrapperRef} />;
  },
);
