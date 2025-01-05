import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';
import type {
  Header as HeaderElement,
  HeaderProperties,
} from '@watching/clips/elements';

import {useCustomElementProperties} from './shared.ts';

export interface HeaderProps
  extends PropsWithChildren<Partial<HeaderProperties>> {
  ref?: ForwardedRef<HeaderElement>;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-header': HeaderProps;
    }
  }
}

export const Header = forwardRef<HeaderElement, HeaderProps>(
  function Header(props, ref) {
    const wrapperRef = useCustomElementProperties(props, ref);
    return <ui-header ref={wrapperRef} />;
  },
);
