import {forwardRef, type ForwardedRef, type PropsWithChildren} from 'react';

import type {
  Text as TextElement,
  TextProperties,
} from '@watching/clips/elements';

export interface TextProps extends Omit<Partial<TextProperties>, 'emphasis'> {
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

export const Text = forwardRef<TextElement, PropsWithChildren<TextElement>>(
  function Text(props, ref) {
    return <ui-text ref={ref} {...props} />;
  },
);
