import type {RenderableProps} from 'preact';

import type {
  Text as TextElement,
  TextProperties,
} from '@watching/clips/elements';

export interface TextProps
  extends RenderableProps<
    Omit<Partial<TextProperties>, 'emphasis'>,
    TextElement
  > {
  emphasis?: TextProperties['emphasis'] | boolean;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-text': TextProps;
    }
  }
}

export function Text(props: TextProps) {
  return <ui-text {...props} />;
}
