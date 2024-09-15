import type {RenderableProps} from 'preact';

import type {
  Text as TextElement,
  TextProperties,
} from '@watching/clips/elements';

export interface TextProps extends Omit<Partial<TextProperties>, 'emphasis'> {
  emphasis?: TextProperties['emphasis'] | boolean;
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
