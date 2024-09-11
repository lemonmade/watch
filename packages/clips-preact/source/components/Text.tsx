import type {RenderableProps} from 'preact';

import type {TextEmphasis, Text as TextElement} from '@watching/clips/elements';

export interface TextProps {
  emphasis?: TextEmphasis | boolean;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-text': TextProps;
    }
  }
}

export function Text(props: RenderableProps<TextProps, TextElement>) {
  return <ui-text {...props} />;
}
