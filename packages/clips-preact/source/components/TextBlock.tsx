import type {RenderableProps} from 'preact';

import type {
  TextBlock as TextBlockElement,
  TextBlockProperties,
} from '@watching/clips/elements';

export interface TextBlockProps extends Partial<TextBlockProperties> {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-text-block': RenderableProps<TextBlockProps, TextBlockElement>;
    }
  }
}

export function TextBlock(
  props: RenderableProps<TextBlockProps, TextBlockElement>,
) {
  return <ui-text-block {...props} />;
}
