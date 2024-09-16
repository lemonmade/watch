import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  Text as TextElement,
  TextProperties,
} from '@watching/clips/elements';

import {useCustomElementProperties} from './shared.ts';

export interface TextProps
  extends PropsWithChildren<Omit<Partial<TextProperties>, 'emphasis'>> {
  ref?: ForwardedRef<TextElement>;
  emphasis?: TextProperties['emphasis'] | boolean;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-text': TextProps;
    }
  }
}

export const Text = forwardRef<TextElement, TextProps>(
  function Text(props, ref) {
    useCustomElementProperties(props, ref);
    return <ui-text {...props} ref={ref} />;
  },
);
