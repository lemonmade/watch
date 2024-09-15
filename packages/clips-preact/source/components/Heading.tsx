import type {RenderableProps} from 'preact';

import type {
  Heading as HeadingElement,
  HeadingProperties,
} from '@watching/clips/elements';

export interface HeadingProps
  extends Omit<Partial<HeadingProperties>, 'level'> {
  level?:
    | HeadingProperties['level']
    | `${NonNullable<HeadingProperties['level']>}`
    | 'auto';
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-heading': RenderableProps<HeadingProps, HeadingElement>;
    }
  }
}

export function Heading(props: RenderableProps<HeadingProps, HeadingElement>) {
  return <ui-heading {...props} />;
}
