import type {RenderableProps} from 'preact';

import type {
  Section as SectionElement,
  SectionProperties,
} from '@watching/clips/elements';

import {ViewProps} from './View.tsx';

export interface SectionProps
  extends RenderableProps<
      Omit<Partial<SectionProperties>, keyof ViewProps>,
      SectionElement
    >,
    Omit<ViewProps, 'ref'> {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-section': SectionProps;
    }
  }
}

export function Section(props: SectionProps) {
  return <ui-section {...props} />;
}
