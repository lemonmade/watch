import type {RenderableProps} from 'preact';

import type {
  Section as SectionElement,
  SectionProperties,
} from '@watching/clips/elements';
import {ViewProps} from './View';

export interface SectionProps
  extends Omit<Partial<SectionProperties>, keyof ViewProps>,
    ViewProps {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-section': RenderableProps<SectionProps, SectionElement>;
    }
  }
}

export function Section(props: RenderableProps<SectionProps, SectionElement>) {
  return <ui-section {...props} />;
}
