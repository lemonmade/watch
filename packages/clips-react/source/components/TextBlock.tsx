import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  TextBlock as TextBlockElement,
  TextBlockProperties,
} from '@watching/clips/elements';

export interface TextBlockProps
  extends PropsWithChildren<Partial<TextBlockProperties>> {
  ref?: ForwardedRef<TextBlockElement>;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-text-block': TextBlockProps;
    }
  }
}

export const TextBlock = forwardRef<TextBlockElement, TextBlockProps>(
  function TextBlock(props, ref) {
    return <ui-text-block ref={ref} {...props} />;
  },
);
