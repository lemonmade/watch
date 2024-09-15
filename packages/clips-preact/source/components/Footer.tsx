import type {RenderableProps} from 'preact';

import type {
  Footer as FooterElement,
  FooterProperties,
} from '@watching/clips/elements';
import {ViewProps} from './View';

export interface FooterProps
  extends Omit<Partial<FooterProperties>, keyof ViewProps>,
    ViewProps {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-footer': RenderableProps<FooterProps, FooterElement>;
    }
  }
}

export function Footer(props: RenderableProps<FooterProps, FooterElement>) {
  return <ui-footer {...props} />;
}
