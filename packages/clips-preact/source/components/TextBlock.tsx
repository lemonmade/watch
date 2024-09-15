import type {RenderableProps} from 'preact';

import type {
  TextBlock as TextBlockElement,
  TextBlockProperties,
} from '@watching/clips/elements';

export interface TextBlockProps
  extends RenderableProps<Partial<TextBlockProperties>, TextBlockElement> {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-text-block': TextBlockProps;
    }
  }
}

export function TextBlock(props: TextBlockProps) {
  return <ui-text-block {...props} />;
}
