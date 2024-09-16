import type {RenderableProps} from 'preact';

import type {
  Footer as FooterElement,
  FooterProperties,
} from '@watching/clips/elements';

import {ViewProps} from './View.tsx';

export interface FooterProps
  extends RenderableProps<
      Omit<Partial<FooterProperties>, keyof ViewProps>,
      FooterElement
    >,
    Omit<ViewProps, 'ref'> {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-footer': FooterProps;
    }
  }
}

export function Footer(props: FooterProps) {
  return <ui-footer {...props} />;
}
