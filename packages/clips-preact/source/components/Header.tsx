import type {RenderableProps} from 'preact';

import type {
  Header as HeaderElement,
  HeaderProperties,
} from '@watching/clips/elements';
import {ViewProps} from './View.tsx';

export interface HeaderProps
  extends RenderableProps<
      Omit<Partial<HeaderProperties>, keyof ViewProps>,
      HeaderElement
    >,
    Omit<ViewProps, 'ref'> {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-header': HeaderProps;
    }
  }
}

export function Header(props: HeaderProps) {
  return <ui-header {...props} />;
}
