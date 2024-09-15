import type {RenderableProps} from 'preact';

import type {
  Header as HeaderElement,
  HeaderProperties,
} from '@watching/clips/elements';
import {ViewProps} from './View';

export interface HeaderProps
  extends Omit<Partial<HeaderProperties>, keyof ViewProps>,
    ViewProps {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-header': RenderableProps<HeaderProps, HeaderElement>;
    }
  }
}

export function Header(props: RenderableProps<HeaderProps, HeaderElement>) {
  return <ui-header {...props} />;
}
