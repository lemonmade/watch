import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';
import type {
  Section as SectionElement,
  SectionProperties,
} from '@watching/clips/elements';

import {useCustomElementProperties} from './shared.ts';

export interface SectionProps
  extends PropsWithChildren<Partial<SectionProperties>> {
  ref?: ForwardedRef<SectionElement>;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-section': SectionProps;
    }
  }
}

export const Section = forwardRef<SectionElement, SectionProps>(
  function Section(props, ref) {
    useCustomElementProperties(props, ref);
    return <ui-section {...props} ref={ref} />;
  },
);
